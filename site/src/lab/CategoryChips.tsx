interface Props {
  categories: string[];
  selected: string | null;
  counts: Record<string, number>;
  onSelect: (category: string | null) => void;
}

export function CategoryChips({ categories, selected, counts, onSelect }: Props) {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  return (
    <nav className="chips" aria-label="Categories">
      <button type="button" aria-pressed={selected === null} onClick={() => onSelect(null)}>
        All <span>{total}</span>
      </button>
      {categories.map((category) => (
        <button key={category} type="button" aria-pressed={selected === category} onClick={() => onSelect(category)}>
          {category} <span>{counts[category]}</span>
        </button>
      ))}
    </nav>
  );
}
