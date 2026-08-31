function result = quality_check(image_path, output_path)
% DRISHTI-AI: Fundus Image Quality Assessment + CLAHE Enhancement
% Inputs:
%   image_path  - path to input fundus image
%   output_path - path to save CLAHE-enhanced image
% Output:
%   result - struct with quality metrics

    img = imread(image_path);
    
    % --- Convert to grayscale for quality metrics ---
    if size(img, 3) == 3
        gray = rgb2gray(img);
    else
        gray = img;
    end
    
    % --- Quality Metrics ---
    brightness  = mean(double(gray(:)));
    contrast    = std(double(gray(:)));
    
    % Sharpness via Laplacian variance
    gray_d = double(gray);
    laplacian = [0 1 0; 1 -4 1; 0 1 0];
    sharpness_map = imfilter(gray_d, laplacian, 'replicate');
    sharpness = var(sharpness_map(:));
    
    % --- Quality Score (0-100) ---
    % Tuned for fundus images (naturally darker, softer than regular photos)
    brightness_score = 0;
    if brightness >= 30 && brightness <= 220
        brightness_score = 33;
    end
    contrast_score = 0;
    if contrast >= 25
        contrast_score = 33;
    end
    sharpness_score = 0;
    if sharpness >= 20
        sharpness_score = 34;
    end
    quality_score = brightness_score + contrast_score + sharpness_score;
    passed = quality_score >= 60;
    
    % --- CLAHE Enhancement (LAB colorspace) ---
    if size(img, 3) == 3
        lab = rgb2lab(img);
        L = lab(:,:,1) ./ 100;           % normalize L to [0,1]
        L_clahe = adapthisteq(L, ...
            'ClipLimit', 0.02, ...
            'NumTiles', [8 8]);
        lab(:,:,1) = L_clahe .* 100;
        enhanced_rgb = lab2rgb(lab);
        enhanced = im2uint8(enhanced_rgb);
    else
        enhanced = adapthisteq(gray, ...
            'ClipLimit', 0.02, ...
            'NumTiles', [8 8]);
    end
    
    imwrite(enhanced, output_path);
    
    % --- Return struct ---
    result.quality_score = quality_score;
    result.brightness    = brightness;
    result.contrast      = contrast;
    result.sharpness     = sharpness;
    result.passed        = passed;
    result.output_path   = output_path;
    
    fprintf('Quality Score: %d | Passed: %d\n', quality_score, passed);
end