import type { TreeNode } from "@nevis/shared";
import { useEffect, useRef } from "react";
import styles from "@/routes/Dashboard.module.css";

/**
 * The scope trail above the chart.
 *
 * Shows the path from the root down to the selected node as a breadcrumb.
 * Ancestors are clickable buttons that select that node, and the current item
 * is plain text showing the node name. Activating an ancestor from the keyboard
 * moves focus to the new current item.
 */

export type ScopeTrailProps = {
  path: TreeNode[];
  labelId: string;
  onSelect: (id: string) => void;
};

export default function ScopeTrail({ path, labelId, onSelect }: ScopeTrailProps) {
  const currentRef = useRef<HTMLSpanElement | null>(null);
  const shouldFocusCurrentRef = useRef(false);

  const ancestors = path.slice(0, -1);
  const current = path[path.length - 1];

  const handleAncestorClick = (event: React.MouseEvent<HTMLButtonElement>, id: string) => {
    if (event.detail === 0) {
      shouldFocusCurrentRef.current = true;
    }
    onSelect(id);
  };

  useEffect(() => {
    if (shouldFocusCurrentRef.current) {
      shouldFocusCurrentRef.current = false;
      currentRef.current?.focus();
    }
  });

  if (!current) {
    return null;
  }

  return (
    <nav aria-label="Chart scope" className={styles.trail}>
      <ol className={styles.crumbs}>
        {ancestors.map((ancestor) => (
          <li key={ancestor.id} className={styles.crumb}>
            <button
              type="button"
              className={styles.ancestorButton}
              onClick={(event) => handleAncestorClick(event, ancestor.id)}
            >
              {ancestor.name}
            </button>
            <span aria-hidden="true" className={styles.separator}>
              {" / "}
            </span>
          </li>
        ))}
        <li className={styles.crumb}>
          <span
            ref={currentRef}
            id={labelId}
            tabIndex={-1}
            aria-current="location"
            className={styles.current}
          >
            {current.name}
          </span>
        </li>
      </ol>
    </nav>
  );
}
