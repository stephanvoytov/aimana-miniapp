/**
 * Постеры витрины «Главной».
 *
 * Картинки — локальные SVG-заглушки (public/img/poster-*.svg): сплошная
 * пастельная заливка под текст. Клиент заменяет файл на свой постер,
 * текст продолжает жить в этом конфиге и остаётся редактируемым.
 *
 * Текст, кнопка и точки в HeroCarousel рассчитаны на светлый постер
 * (чёрный по светлому). Если постер тёмный — в HeroCarousel поменяйте
 * text-black/bg-black на белые варианты.
 */
export type Poster = {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  image: string;
  /** подборка, которая открывается по кнопке */
  collection: "all" | "new" | "best" | "sale";
};

export const POSTERS: Poster[] = [
  {
    id: "new-collection",
    title: "Новая коллекция",
    subtitle: "Стиль. Комфорт. Ты.",
    cta: "Перейти",
    image: "img/poster-1.svg",
    collection: "new",
  },
  {
    id: "best",
    title: "Выбор покупателей",
    subtitle: "То, что берут чаще всего",
    cta: "Смотреть",
    image: "img/poster-2.svg",
    collection: "best",
  },
  {
    id: "sale",
    title: "Скидки до 30%",
    subtitle: "Успей, пока размеры в наличии",
    cta: "К скидкам",
    image: "img/poster-3.svg",
    collection: "sale",
  },
];
