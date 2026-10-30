import { FeedFilterSelect } from "./FeedFilterSelect";
import { getCampusAreas, isCampusArea } from "@/lib/campusAreas";
import { CAMPUS_OPTIONS } from "@/lib/campuses";

export function CampusAreaSelect({ campus, value, onChange, required = false, fitContent = false }: {
  campus: string;
  value: string;
  onChange: (area: string, campus: string) => void;
  required?: boolean;
  fitContent?: boolean;
}) {
  const areas = getCampusAreas(campus);
  return (
    <FeedFilterSelect
      aria-label="Khu vực"
      title="Khu vực"
      fitContent={fitContent}
      required={required}
      value={isCampusArea(campus, value) ? value : ""}
      onChange={(event) => onChange(event.target.value, event.target.selectedOptions[0]?.dataset.campus || campus)}
    >
      <option value="">Khu vực{required ? " *" : ""}</option>
      {areas.length
        ? areas.map((area) => <option key={area} value={area} data-campus={campus}>{area}</option>)
        : CAMPUS_OPTIONS.filter((item) => item.value !== "all").map((item) => (
          <optgroup key={item.value} label={item.label}>
            {getCampusAreas(item.value).map((area) => <option key={area} value={area} data-campus={item.value}>{area}</option>)}
          </optgroup>
        ))}
    </FeedFilterSelect>
  );
}
