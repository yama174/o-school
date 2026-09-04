"use client";

import { useState } from "react";
import { FieldLabel, inputClass } from "@/components/ui";

export interface GradeWithClasses {
  id: string;
  name: string;
  classes: { id: string; name: string }[];
}

export function ClassPicker({
  grades,
  defaultGradeId,
  defaultClassId,
}: {
  grades: GradeWithClasses[];
  defaultGradeId?: string;
  defaultClassId?: string;
}) {
  const [gradeId, setGradeId] = useState(defaultGradeId ?? grades[0]?.id ?? "");
  const classes = grades.find((g) => g.id === gradeId)?.classes ?? [];

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <FieldLabel>学年</FieldLabel>
        <select
          value={gradeId}
          onChange={(e) => setGradeId(e.target.value)}
          className={inputClass}
        >
          {grades.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <FieldLabel>クラス</FieldLabel>
        <select name="classId" required defaultValue={defaultClassId} className={inputClass} key={gradeId}>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
