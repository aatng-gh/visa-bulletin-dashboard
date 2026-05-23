import { For } from "solid-js";
import { AREA_LABELS, Language, VisaRow } from "../lib/visa.ts";

interface DataTableProps {
  rows: VisaRow[];
  language: Language;
  t: (key: string, params?: Record<string, string>) => string;
  bulletinLabel: (key: string) => string;
}

export function DataTable(props: DataTableProps) {
  return (
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{props.t("tableBulletin")}</th>
            <th>{props.t("tableGroup")}</th>
            <th>{props.t("tableCategory")}</th>
            <th>{props.t("tableCountry")}</th>
            <th>{props.t("tableCutoff")}</th>
          </tr>
        </thead>
        <tbody>
          <For each={props.rows}>
            {(row) => (
              <tr>
                <td>
                  <a href={row.url}>{props.bulletinLabel(row.bulletinKey)}</a>
                </td>
                <td>{props.t(row.group)}</td>
                <td>{row.category}</td>
                <td>{AREA_LABELS[props.language][row.country]}</td>
                <td>{row.cutoff.iso ?? row.cutoff.raw}</td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  );
}
