
import { Difficulty } from './types';

export const ROUND_DURATION = 60;

export const WORDS_UA: Record<Difficulty, string[]> = {
  easy: ["Кіт", "Сонце", "Кава", "Книга", "Машина", "Океан", "Гітара", "Піца", "Яблуко", "Диван", "Школа", "Торт", "Сім'я", "Подарунок", "Хмара", "Літак", "Стіл", "Вікно", "Риба", "Квітка"],
  medium: ["Космонавт", "Програміст", "Університет", "Інвестиції", "Паляниця", "Карпати", "Еволюція", "Магніт", "Сцена", "Стипендія", "Алгоритм", "Гравітація", "Провідник", "Музей", "Діамант"],
  hard: ["Екзистенціалізм", "Метаморфоза", "Дисонанс", "Агностицизм", "Синхрофазотрон", "Когнітивність", "Прокрастинація", "Абстракція", "Інтроспекція", "Парадигма", "Ентропія"]
};

export const WORDS_EN: Record<Difficulty, string[]> = {
  easy: ["Cat", "Sun", "Coffee", "Book", "Car", "Ocean", "Guitar", "Pizza", "Soccer", "Apple", "Clock", "Mirror", "School", "Cake", "Family", "Gift", "Cloud", "Bread", "Water", "Tree"],
  medium: ["Astronaut", "Developer", "University", "Investment", "Software", "Mountain", "Evolution", "Magnet", "Stage", "Scholarship", "Algorithm", "Gravity", "Museum", "Diamond"],
  hard: ["Existentialism", "Metamorphosis", "Dissonance", "Agnosticism", "Cognitive", "Procrastination", "Abstraction", "Introspection", "Heuristic", "Paradigm", "Entropy"]
};

export const SCORE_OPTIONS = [10, 25, 50, 100];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Легкий",
  medium: "Середній",
  hard: "Важкий"
};
