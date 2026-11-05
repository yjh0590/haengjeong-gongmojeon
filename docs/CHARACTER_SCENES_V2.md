# 캐릭터 합성 이미지 v2

- 방식: 내장 image_gen 도구, 참조 이미지 기반 합성(compositing)
- 참조: 사용자가 제공한 도송이·포롬이 캐릭터 시트. 도송이 휴대폰 포즈와 포롬이 안내 포즈를 선택했습니다.
- 원본과 이전 캐릭터 파일은 보존했습니다. 아래 최종 이미지만 화면에서 사용합니다.
- 색상: 손님·메인은 푸른색, 상인 화면은 아이보리·살구색. 이미지의 흰 가장자리가 페이지 배경에 이어지도록 배치합니다.
- 전송용 최적화: 합성 결과의 전체 구도를 유지한 채 크기와 인코딩만 조정합니다.

## 최종 파일

- public/brand/characters/customer-scene-v2.webp
- public/brand/characters/merchant-scene-v2.webp
- public/brand/characters/dosongi-avatar-v2.webp
- public/favicon-v2.png

## 실제 사용한 프롬프트

### 손님·메인 장면

Use case: compositing. Asset type: final landscape website illustration, 1536x1024. Supporting source is the attached character reference sheet: select ONLY the white/silver otter mascot Dosongi wearing round black glasses, white hoodie, backwards navy cap and cobalt blue crossbody bag. Preserve its exact face, spotted fur, proportions, recognizable clothing and premium soft 3D rendering. Recompose the phone-holding pose as one complete full-body character, at left-center, checking the blue phone beside a small tasteful isometric neighborhood map platform with a curved blue walking path, a single map pin, two tiny cream storefronts and a coffee cup detail. Harmonize all elements into ONE coherent scene with shared lighting, physically grounded soft contact shadows and matching scale. Soft powder-blue and pale lavender ambient backdrop transitioning to white at the outer edges, rounded low-relief terrain, warm friendly expression, elegant layered depth, ample breathing room. Character occupies about 55% of height, other elements secondary. No text, no labels, no existing reference-sheet captions, no watermark, no UI screenshots, no frame, no sticker border, no duplicate characters, no collage. This artwork will be displayed around 280–360px wide beside Korean website headings on a near-white pale blue background; it must look rich and integrated, never a tiny isolated sticker. Fully opaque image with natural white edge blending.

### 상인 장면

Use case: compositing. Asset type: final landscape website illustration, 1536x1024. Supporting source is the attached character reference sheet: select ONLY Porumi, the brown spotted otter mascot in dark brown three-piece suit, brown newsboy cap, white shirt and rust tie, pocket watch chain and brown leather satchel. Preserve its exact face, fur, chubby proportions, clothing, accessories and premium soft 3D render. Use the inviting one-arm presentation pose, as a complete full-body character at left-center, welcoming the viewer to a small beautifully modeled cream neighborhood cafe storefront on a rounded warm-beige platform; a simple rust-orange awning, subtle menu board containing only a few abstract lines, and a small paper promotion card with a simple heart/spark motif. One coherent composition with unified soft studio lighting, perspective and grounded contact shadows. Warm ivory, soft peach and muted terracotta palette matching a near-white merchant dashboard. The backdrop fades smoothly to white at the outer edges. Keep the character about 55% of image height and storefront secondary with restrained detail, mature friendly service-brand mood. No words, no letters, no captions, no watermark, no logos, no sticker border, no duplicate characters, no collage. Intended display size 280–360px wide beside Korean page headings; rich but calm, with meaningful visual depth. Fully opaque background for natural edge blending.

### 공통 캐릭터 아이콘

Use case: compositing. Final square website brand avatar and browser favicon. Supporting reference image is the provided character sheet. Select ONLY Dosongi, the silver-white spotted otter with large round black eyeglasses and backwards navy baseball cap. Make a tightly framed head-and-shoulders portrait retaining the exact recognizable face, big warm dark eyes, glasses, spotted fur, white hoodie neckline and navy cap. Friendly subtle smile, facing camera. Premium soft 3D render consistent with the source. Composite naturally onto a pale periwinkle-to-ivory studio background with soft ambient light, restrained dimensional shading and one tiny cobalt highlight. Face is very large and centered, about 80% of width, cap stays inside canvas, neck/chest ends at lower edge. The image must remain clear at 32px and 48px. Exactly one character. No text, no letters, no badge, no sticker outline, no outer border, no logos, no watermark, no extra props. Opaque square, 1024x1024.
