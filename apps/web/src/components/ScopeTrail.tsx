import type { Company, TreeNode } from "@nevis/shared";
import { useEffect, useMemo, useRef } from "react";
import { pathTo } from "@/lib/tree";
import styles from "./ScopeTrail.module.css";

export type ScopeTrailProps = {
  company: Company;
  selectedId: string;
  labelledById: string;
  onSelect: (id: string) => void;
};

function resolveTrail(company: Company, selectedId: string): TreeNode[] {
  const path = pathTo(company, selectedId);
  return path.length > 0 ? path : [company];
}

export function ScopeTrail({ company, selectedId, labelledById, onSelect }: ScopeTrailProps) {
  const currentRef = useRef<HTMLSpanElement | null>(null);
  const shouldFocusCurrentRef = useRef(false);

  const path = useMemo(() => resolveTrail(company, selectedId), [company, selectedId]);
  const ancestors = path.slice(0, -1);
  const current = path[path.length - 1];

  const handleAncestorClick = (event: React.MouseEvent<HTMLButtonElement>, id: string) => {
    if (event.detail === 0) {
      shouldFocusCurrentRef.current = true;
    }
    onSelect(id);
  };

  // Keyboard activation moves focus to the new current item; pointer clicks do not.
  useEffect(() => {
    if (!shouldFocusCurrentRef.current) return;

    shouldFocusCurrentRef.current = false;
    currentRef.current?.focus();
  });

  if (!current) return null;

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
            id={labelledById}
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
