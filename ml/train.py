import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler
from torchvision import transforms
import timm
import pandas as pd
import numpy as np
from PIL import Image
from pathlib import Path
import os

# ── Config ───────────────────────────────────────────────────────────────────
DEVICE      = torch.device("cuda" if torch.cuda.is_available() else "cpu")
EPOCHS      = 25
BATCH_SIZE  = 16
LR          = 1e-4
IMG_SIZE    = 380
NUM_CLASSES = 5
MODEL_SAVE  = Path("models/efficientnet_b4_dr.pth")

print(f"[TRAIN] Device: {DEVICE}")

# ── Data paths ────────────────────────────────────────────────────────────────
APTOS_CSV   = Path("data/aptos2019/train.csv")
APTOS_IMGS  = Path("data/aptos2019/train_images")

IDRID_CSV   = Path("data/idrid/idrid_labels.csv")
IDRID_IMGS  = Path("data/idrid/Imagenes/Imagenes")

EYEPACS_CSV  = Path("data/dr_extra/trainLabels_cropped.csv")
EYEPACS_IMGS = Path("data/dr_extra/resized_train_cropped/resized_train_cropped")

# ── Build unified dataframe ───────────────────────────────────────────────────
def build_dataframe():
    rows = []

    # APTOS
    df = pd.read_csv(APTOS_CSV)
    for _, r in df.iterrows():
        img = APTOS_IMGS / f"{r['id_code']}.png"
        if img.exists():
            rows.append({"path": str(img), "grade": int(r["diagnosis"]), "dme": -1})

    # IDRiD
    df2 = pd.read_csv(IDRID_CSV)
    for _, r in df2.iterrows():
        # Try png and jpg
        for ext in [".jpg", ".png", ".JPG"]:
            img = IDRID_IMGS / f"{r['id_code']}{ext}"
            if img.exists():
                dme = 1 if r["Risk of macular edema "] >= 1 else 0
                rows.append({"path": str(img), "grade": int(r["diagnosis"]), "dme": dme})
                break

    # EyePACS
    df3 = pd.read_csv(EYEPACS_CSV)
    for _, r in df3.iterrows():
        for ext in [".jpeg", ".jpg", ".png"]:
            img = EYEPACS_IMGS / f"{r['image']}{ext}"
            if img.exists():
                rows.append({"path": str(img), "grade": int(r["level"]), "dme": -1})
                break

    df_all = pd.DataFrame(rows)
    print(f"[DATA] Total samples: {len(df_all)}")
    print(f"[DATA] Grade distribution:\n{df_all['grade'].value_counts().sort_index()}")
    print(f"[DATA] DME labels available: {(df_all['dme'] >= 0).sum()}")
    return df_all

# ── Dataset ───────────────────────────────────────────────────────────────────
class DRDataset(Dataset):
    def __init__(self, df, transform=None):
        self.df        = df.reset_index(drop=True)
        self.transform = transform

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row   = self.df.iloc[idx]
        image = Image.open(row["path"]).convert("RGB")
        if self.transform:
            image = self.transform(image)
        grade = torch.tensor(row["grade"], dtype=torch.long)
        dme   = torch.tensor(max(row["dme"], 0), dtype=torch.long)
        has_dme_label = torch.tensor(row["dme"] >= 0, dtype=torch.bool)
        return image, grade, dme, has_dme_label

# ── Transforms ────────────────────────────────────────────────────────────────
train_transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomVerticalFlip(),
    transforms.RandomRotation(20),
    transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.1),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

val_transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# ── Model ─────────────────────────────────────────────────────────────────────
class DRModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.backbone = timm.create_model("efficientnet_b4", pretrained=True, num_classes=0)
        feat_dim = self.backbone.num_features
        self.dr_head  = nn.Sequential(nn.Dropout(0.3), nn.Linear(feat_dim, NUM_CLASSES))
        self.dme_head = nn.Sequential(nn.Dropout(0.3), nn.Linear(feat_dim, 2))

    def forward(self, x):
        feats = self.backbone(x)
        return self.dr_head(feats), self.dme_head(feats)

# ── Weighted sampler for class imbalance ──────────────────────────────────────
def get_sampler(df):
    counts  = df["grade"].value_counts().sort_index()
    weights = 1.0 / counts
    sample_weights = df["grade"].map(weights).values
    return WeightedRandomSampler(sample_weights, len(sample_weights), replacement=True)

# ── Train ─────────────────────────────────────────────────────────────────────
def train():
    MODEL_SAVE.parent.mkdir(parents=True, exist_ok=True)

    df_all  = build_dataframe()
    val_df  = df_all.sample(frac=0.15, random_state=42)
    train_df = df_all.drop(val_df.index)

    print(f"[TRAIN] Train: {len(train_df)} | Val: {len(val_df)}")

    train_ds = DRDataset(train_df, train_transform)
    val_ds   = DRDataset(val_df,   val_transform)

    sampler      = get_sampler(train_df)
    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, sampler=sampler, num_workers=2, pin_memory=True)
    val_loader   = DataLoader(val_ds,   batch_size=BATCH_SIZE, shuffle=False,   num_workers=2, pin_memory=True)

    model        = DRModel().to(DEVICE)
    dr_criterion = nn.CrossEntropyLoss()
    dme_criterion= nn.CrossEntropyLoss()
    optimizer    = optim.AdamW(model.parameters(), lr=LR, weight_decay=1e-4)
    scheduler    = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS)

    best_sensitivity = 0.0

    for epoch in range(EPOCHS):
        model.train()
        total_loss = 0.0
        correct = 0
        total   = 0

        for imgs, grades, dme_labels, has_dme in train_loader:
            imgs, grades = imgs.to(DEVICE), grades.to(DEVICE)
            dme_labels   = dme_labels.to(DEVICE)
            has_dme      = has_dme.to(DEVICE)

            optimizer.zero_grad()
            dr_logits, dme_logits = model(imgs)

            dr_loss = dr_criterion(dr_logits, grades)
            dme_loss = 0.0
            if has_dme.any():
                dme_loss = dme_criterion(dme_logits[has_dme], dme_labels[has_dme])

            loss = dr_loss + 0.3 * dme_loss
            loss.backward()
            optimizer.step()

            total_loss += loss.item()
            preds = dr_logits.argmax(dim=1)
            correct += (preds == grades).sum().item()
            total   += grades.size(0)

        train_acc = correct / total * 100

        # Val
        model.eval()
        val_correct = 0
        val_total   = 0
        tp = fp = fn = 0

        with torch.no_grad():
            for imgs, grades, _, _ in val_loader:
                imgs, grades = imgs.to(DEVICE), grades.to(DEVICE)
                dr_logits, _ = model(imgs)
                preds = dr_logits.argmax(dim=1)

                val_correct += (preds == grades).sum().item()
                val_total   += grades.size(0)

                ref_true = grades >= 2
                ref_pred = preds  >= 2
                tp += (ref_pred & ref_true).sum().item()
                fn += (~ref_pred & ref_true).sum().item()
                fp += (ref_pred & ~ref_true).sum().item()

        val_acc     = val_correct / val_total * 100
        sensitivity = tp / (tp + fn + 1e-8) * 100
        specificity = (val_total - tp - fp - fn) / (val_total - tp - fn + 1e-8) * 100
        scheduler.step()

        print(f"Epoch {epoch+1:02d}/{EPOCHS} | "
              f"Loss: {total_loss/len(train_loader):.4f} | "
              f"Train: {train_acc:.1f}% | "
              f"Val: {val_acc:.1f}% | "
              f"Sensitivity: {sensitivity:.1f}% | "
              f"Specificity: {specificity:.1f}%")

        if sensitivity > best_sensitivity:
            best_sensitivity = sensitivity
            torch.save(model.state_dict(), MODEL_SAVE)
            print(f"  --> Saved (sensitivity: {sensitivity:.1f}%)")

    print(f"\n[DONE] Best sensitivity: {best_sensitivity:.1f}%")
    print(f"[DONE] Model: {MODEL_SAVE}")

if __name__ == "__main__":
    train()
