# C동 거리 사진 보정

- 방식: 내장 `image_gen` 이미지 편집 도구. 별도 API·CLI는 사용하지 않았습니다.
- 원본: `public/street/c-block/street-back.jpg` (1081 × 1440, 보존)
- 사용 보정본: `public/street/c-block/street-back-retouched.png` (1087 × 1447)
- 수정 의도: 바닥에 비친 촬영자 그림자 제거. 원본의 구도와 시야를 유지하도록 요청했습니다.
- 앞 방향·입구·점포 사진은 원본을 사용합니다. 화면은 이미지의 실제 가로세로 비율을 읽어 전체 사진을 표시합니다. 사진을 확대하거나 가로 화면에 맞춰 잘라내지 않습니다.

최종 편집 프롬프트:

> Use case: precise-object-edit. Edit target: the supplied real street photograph, not an inspiration image. Remove ONLY the photographer's dark human silhouette shadow on the bottom foreground pavement, roughly x=550..750, y=1180..1440 in the 1081x1440 source. Fill that small shadow region with continuous matching sunlit paving tiles, preserving perspective, grout, texture and the separate thin vertical shadow immediately to its left. Leave all architecture, storefronts, Korean signs, plants, people elsewhere, other shadows, sky, colors, camera angle, framing, aspect ratio and focal length unchanged. Do not crop, zoom, widen, regenerate the street or alter businesses. Deliver the edited photograph alone, with the same portrait composition and ideally the same 1081x1440 dimensions. This is a factual street-view asset: do not invent or beautify any scene detail outside the shadow removal area.
