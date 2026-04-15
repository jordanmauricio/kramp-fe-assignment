import styles from './SearchDialog.module.css';

// Ax4: This component has no ARIA combobox pattern.
// Missing: role="listbox" on container, role="option" on items,
//          aria-expanded and aria-haspopup on the trigger input,
//          aria-activedescendant for keyboard navigation.
// The correct solution is either a full ARIA combobox implementation
// or a native <dialog> element with <input> inside.
//
// T8: array index used as key — breaks reconciliation when results update/reorder

interface SearchDialogProps {
  results: any[]; // T1: should be SearchResult[] or Pick<Product, 'id' | 'name' | 'imageUrl'>[]
  onSelect: (id: string) => void;
}

export function SearchDialog({ results, onSelect }: SearchDialogProps) {
  if (!results.length) return null;

  return (
    // No role="listbox", no id for aria-controls on the input
    <div className={styles.dialog}>
      {results.map((result, index) => (
        // T8: key is array index — should be result.id
        // Ax4: <div> should be role="option"; no keyboard handling (arrow keys, Enter)
        <div
          key={index}
          className={styles.item}
          onClick={() => onSelect(result.id)}
        >
          <span className={styles.itemName}>{result.name}</span>
          <span className={styles.itemPrice}>€{result.price.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}
