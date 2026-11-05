# 전체 배경 배너 v4

내장 image_gen 도구로 참조 이미지를 편집·합성했습니다. 직전 버전에서 추가한 페이지 전체의 진한 그라데이션은 제거했습니다. 기존 캐릭터와 배경의 색을 유지하면서, 손님·상인 배너는 모서리까지 풍경이 이어지는 전체 배경 장면으로 바꿨습니다. 작은 스티커 형태의 캐릭터는 이 배너에서 사용하지 않습니다.

## 최종 파일

- public/brand/characters/main-duo-v4.webp: 가게·받침대·길·식물을 제거한 메인 두 캐릭터, 투명 배경
- public/brand/characters/customer-banner-v4.webp: 손님용 거리 배경, 가로
- public/brand/characters/merchant-banner-v4.webp: 상인용 가게 배경, 가로
- public/brand/characters/customer-mobile-v4.webp: 손님용 거리 배경, 모바일 세로
- public/brand/characters/merchant-mobile-v4.webp: 상인용 가게 배경, 모바일 세로

두 캐릭터 아이콘과 짧은 사이트 제목은 유지합니다. 모든 배경 이미지는 연출 일러스트이며 실측 지도나 실제 점포 사진을 대신하지 않습니다. 기존 원본은 보존하고, 전송용 WebP는 전체 구도를 유지한 채 크기와 인코딩만 최적화했습니다.

## 실제 사용한 프롬프트

### main

Use case: precise-object-edit. Edit the supplied main duo illustration. Preserve EXACTLY the two embracing characters as they currently appear: brown otter Porumi on left in newsboy cap, three-piece suit, satchel and pocket watch, silver-white otter Dosongi on right in navy backwards cap, round black glasses, white hoodie and blue bag. Keep their faces, full-body scale, pose, fur, proportions and clothing unchanged. REMOVE everything else: cafe building, awning, lamp, cafe furniture, all plants and flowers, paths, raised platform, floor base, and all colored background glow. Output ONLY the complete two-character group with clean natural fine fur edges on genuinely TRANSPARENT background. Remove the excessive saturated cobalt rim glow, replacing it with subtle cool daylight on edges and warm natural face lighting suitable for compositing on an Incheon bridge photograph. Do not add any scenery, pedestal, ground plate, halo, sticker outline, text or border. Keep both characters' feet visible and leave a modest 5% clear margin. Landscape 1536x1024; transparent output.

### customer

Use case: compositing. Create a very wide full-bleed website hero illustration, 1920x800, 2.4:1 landscape. Reference image is the approved Dosongi-and-neighborhood illustration. Preserve Dosongi's exact friendly silver-white spotted face, round black eyeglasses, backwards navy cap, white hoodie, blue shoulder bag, blue phone, proportions and premium soft 3D fur rendering. Transform the miniature vignette into a continuous walkable neighborhood street that fills EVERY pixel from left to right and top to bottom: blue-hour sky, cafe and small local storefront facades, street paving, windows, subtle greenery, connected walking path, restrained blue signage WITHOUT any letters. NOT a floating model on a white studio floor. No isolated vignette, no rounded platform, no white margins, no fade to white, no frame. Keep Dosongi fully visible on the FAR RIGHT, around x=78%, y=55%, with a full body that occupies 58% of image height, checking his phone. Keep the LEFT 50% as an uncluttered but visibly environmental area of cool-blue sky and simple distant street facades, readable as a beautiful backdrop for dark navy Korean text and search controls added in code. Rich coherent atmospheric daylight/cool blue and soft lavender palette, unified lighting, deep but calm environment. Environment must remain colorful and crisp rather than pale or washed out. No text, no UI elements, no watermarks, no other characters. The character and background must look like one coherent scene, NOT a sticker pasted over scenery.

### merchant

Use case: compositing. Create a very wide full-bleed merchant website hero illustration, 1920x800, 2.4:1 landscape. Reference image is the approved Porumi-and-cafe illustration. Preserve Porumi's exact brown spotted otter face, brown newsboy cap, dark brown three-piece suit, rust tie, leather satchel, watch chain, body proportions and premium soft 3D rendering. Expand the scene into a continuous neighborhood storefront street filling EVERY pixel, edge to edge: warmly lit terracotta-awning cafe, brick and plaster architecture, wood doors, plants, pavement, inviting shopfront atmosphere. No floating pedestal, no rounded miniature base, no studio backdrop, no white margins or fade to white, no frame. Porumi stands welcoming on the FAR RIGHT around x=78%, y=55%, full body occupies about 60% of image height. His warm cafe is behind him and extends off the right edge. The LEFT 50% is a quieter continuous brick-and-plaster storefront facade in rich warm rust and muted brown midtones, reserved for white Korean headline and button added later in code; keep this area low-detail and sufficiently dark, but environmental rather than a flat fill. Shared warm late-afternoon lighting, subtle realistic shadows, rich peach/terracotta tones, cozy and professional, never washed out. No text, no UI labels, no logos, no watermark, no extra characters. Make character and street one coherent scene.

### customerMobile

Use case: compositing / responsive reframing. Recompose the supplied wide Dosongi neighborhood hero as a VERTICAL mobile website banner, 768x1152 portrait 2:3. Preserve the exact otter character identity, expression, clothes, phone and blue-lavender neighborhood atmosphere. Keep a continuous detailed illustrated environment filling every edge; no white margins, no vignette, no pedestal, no blank studio space. The UPPER 48% is an uncluttered cool-blue sky above distant low storefront rooftops, reserved for navy headline, search and category controls to be added in code. Place the full Dosongi character in the LOWER RIGHT, from approximately y=52% to y=92%, large friendly face around y=61%, standing on the street beside the blue-awning cafe. Left lower portion has a gently curving paved walking street and small plants. Retain the premium soft 3D rendering and clear vivid colors without washing out the backdrop. No words, letters, logos, text, UI or watermark.

### merchantMobile

Use case: compositing / responsive reframing. Recompose the supplied wide Porumi warm cafe street hero as a VERTICAL mobile website banner, 768x1152 portrait 2:3. Preserve exact otter face, fur, cap, suit, satchel, pose and warm afternoon street palette. Full-bleed architecture and paving across every edge. UPPER 44% consists of a quieter warm dark terracotta plaster cafe facade with low detail and subtle foliage shadow, reserved for white headline and CTA to be added in code. Porumi is in LOWER RIGHT from around y=48% to y=92%, full body on actual cobbled pavement, warmly presenting the cafe. Place its terracotta awning and inviting doorway behind him in the lower-right region. Continuous environmental composition, no isolated vignette, no white margin, no fading to white, no floating platform. Rich restrained colors, unified soft 3D lighting. No text, letters, UI, logos or watermark.
