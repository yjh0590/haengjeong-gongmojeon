# 두 캐릭터와 색상 배너 v3

내장 image_gen 도구로 사용자가 제공한 두 캐릭터 사진을 참조하여 합성했습니다. 메인용 장면은 투명 배경을 유지하므로 기존 인천대교 사진과 파란색 배너가 가장자리에 그대로 보입니다. 손님은 블루·라벤더, 상인은 피치·오렌지 그라데이션을 적용했습니다. 기존 이미지와 원본 생성 결과는 보존했습니다.

## 최종 파일

- public/brand/characters/together-hero-v3.webp (960×640, 투명 배경)
- public/brand/characters/together-avatar-v3.webp (192×192, 공통 헤더 아이콘)
- public/favicon-v3.png (64×64, 공통 브라우저 아이콘)

## 실제 사용한 프롬프트

### 메인 장면

Use case: compositing. Asset type: a transparent foreground illustration for a saturated blue website hero banner, landscape 1536x1024. Supporting image 1 is the exact two-mascot embrace photo: brown spotted otter Porumi in newsboy cap and dark brown three-piece suit with leather satchel and pocket watch, beside silver-white spotted otter Dosongi in backwards navy cap, round black glasses, white hoodie and blue crossbody bag. Supporting image 2 is the same character reference sheet for full body details. Preserve their exact recognizable faces, body proportions, clothing, color, fur and warm premium 3D rendering. Recreate the arm-around-shoulders together pose, both smiling gently, full bodies visible, brown mascot on left and silver mascot on right. Composite them as one coherent rich illustration on a small rounded miniature neighborhood platform: one cream cafe storefront with a blue awning behind the right character, a short curved cobalt walking path and restrained foliage near their feet. Duo is the main subject, occupies about 70% of image width and 80% of height; scene secondary. Soft shared studio lighting with cool blue rim light suitable for a dark cobalt banner, gentle grounded contact shadows. TRANSPARENT background around the entire grouped duo and miniature platform. Absolutely no white, ivory or colored rectangular background, no opaque sky, no fade to white, no frame, no sticker outline, no text, no lettering, no watermark, no duplicate characters. Nothing cropped. The artwork will sit on the RIGHT of an existing blue Incheon bridge photo with white website text on the LEFT; do not generate any website text. Preserve honest transparency to keep the blue banner visible around all edges.

### 두 캐릭터 아이콘

Use case: compositing. Asset type: square shared website avatar and favicon, 1024x1024. Use the supplied exact two-character embrace photo as identity and pose reference. Create a tightly framed shoulder-up friendly portrait of BOTH mascots together, brown Porumi on LEFT wearing brown newsboy cap, silver-white Dosongi on RIGHT wearing round black glasses and backwards navy baseball cap. Preserve their distinctive faces, fur, clothing and premium soft 3D source style. Faces side by side, equally large, both fully visible and smiling, combined heads occupy 90% of canvas width; very little unused space. Crop lower bodies away. One soft powder-blue-to-lavender background, warm natural shared lighting. Make the two faces visually clear at small 32px and 48px favicon sizes. Exactly these two characters, no extra characters, no text, no logo, no badge, no sticker border, no watermark.
