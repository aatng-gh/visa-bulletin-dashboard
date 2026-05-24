import { AREA_LABELS, formatCutoffForDisplay, Language, VisaRow } from "../lib/visa";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

interface DataTableProps {
  rows: VisaRow[];
  language: Language;
  t: (key: string, params?: Record<string, string>) => string;
  bulletinLabel: (key: string) => string;
}

export function DataTable(props: DataTableProps) {
  return (
    <div className="max-h-[650px] overflow-auto rounded-md border">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-muted">
          <TableRow>
            <TableHead>{props.t("tableBulletin")}</TableHead>
            <TableHead>{props.t("tableGroup")}</TableHead>
            <TableHead>{props.t("tableCategory")}</TableHead>
            <TableHead>{props.t("tableCountry")}</TableHead>
            <TableHead>{props.t("tableCutoff")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                {props.t("noDataSelected")}
              </TableCell>
            </TableRow>
          ) : (
            props.rows.map((row) => (
              <TableRow key={`${row.bulletinKey}-${row.category}-${row.country}`}>
                <TableCell>
                  <a href={row.url}>{props.bulletinLabel(row.bulletinKey)}</a>
                </TableCell>
                <TableCell>{props.t(row.group)}</TableCell>
                <TableCell>{row.category}</TableCell>
                <TableCell>{AREA_LABELS[props.language][row.country]}</TableCell>
                <TableCell>{formatCutoffForDisplay(props.language, row.cutoff)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
