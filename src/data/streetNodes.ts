import type { StreetNode } from "../types/street";

export const streetNodes: StreetNode[] = [
  {
  id: "point1",
  number: 1,
  name: "D동",
  subtitle: "타임스페이스 D동",

  views: {
    forward: "/street/point1-forward.jpg",
    back: "/street/point1-back.jpg",
  },

  stores: [1, 2],

  connections: [],
},

  {
    id: "point2",
    number: 2,
    name: "2번 촬영 지점",
    subtitle: "타임스페이스 북측 중앙 구역",

    views: {
      // forward: "/street/point2-forward.jpg",
      // back: "/street/point2-back.jpg",
      // left: "/street/point2-left.jpg",
      // right: "/street/point2-right.jpg",
    },

    stores: [2, 3, 4],

    connections: [
      {
        direction: "back",
        to: "point1",
        label: "1번 지점으로 이동",
        arrivalView: "back",
      },

      {
        direction: "right",
        to: "point3",
        label: "3번 지점으로 이동",
        arrivalView: "right",
      },
    ],
  },

  {
    id: "point3",
    number: 3,
    name: "3번 촬영 지점",
    subtitle: "타임스페이스 동측 중앙 구역",

    views: {
      // forward: "/street/point3-forward.jpg",
      // back: "/street/point3-back.jpg",
      // left: "/street/point3-left.jpg",
      // right: "/street/point3-right.jpg",
    },

    stores: [3, 4, 5],

    connections: [
      {
        direction: "left",
        to: "point2",
        label: "2번 지점으로 이동",
        arrivalView: "left",
      },

      {
        direction: "back",
        to: "point4",
        label: "4번 지점으로 이동",
        arrivalView: "back",
      },
    ],
  },

  {
    id: "point4",
    number: 4,
    name: "4번 촬영 지점",
    subtitle: "타임스페이스 남측 구역",

    views: {
      // forward: "/street/point4-forward.jpg",
      // back: "/street/point4-back.jpg",
      // left: "/street/point4-left.jpg",
      // right: "/street/point4-right.jpg",
    },

    stores: [5, 6],

    connections: [
      {
        direction: "forward",
        to: "point3",
        label: "3번 지점으로 이동",
        arrivalView: "forward",
      },
    ],
  },
];
