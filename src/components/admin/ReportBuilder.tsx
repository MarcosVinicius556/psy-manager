"use client";

import { useState, type ReactNode } from "react";
import { HiOutlineChevronDown, HiOutlineChevronUp, HiOutlinePlus, HiOutlineStar, HiOutlineTrash, HiStar } from "react-icons/hi";
import DateField from "@/components/admin/DateField";
import Select from "@/components/admin/Select";
import { DataTable, Empty, Field, Td, Th, fieldClass } from "@/components/admin/ui";
import {
  defaultDefinition,
  describeReport,
  emptyFilter,
  ENTITY_OPTIONS,
  fieldOf,
  fieldsOf,
  operatorsOf,
  refOptions,
  relationsOf,
  type EntityId,
  type FilterClause,
  type FilterKind,
  type ReportDefinition,
  type ReportResult,
  type ReportStore,
} from "@/lib/admin/reports";

function patchFilters(list: FilterClause[], id: string, patch: Partial<FilterClause>): FilterClause[] {
  return list.map((item) => {
    if (item.id === id) return { ...item, ...patch };
    if (item.children.length) return { ...item, children: patchFilters(item.children, id, patch) };
    return item;
  });
}

function removeFilter(list: FilterClause[], id: string): FilterClause[] {
  return list.filter((item) => item.id !== id).map((item) => ({ ...item, children: removeFilter(item.children, id) }));
}

function addChild(list: FilterClause[], parentId: string, child: FilterClause): FilterClause[] {
  return list.map((item) => (item.id === parentId ? { ...item, children: [...item.children, child] } : { ...item, children: addChild(item.children, parentId, child) }));
}

function Accordion({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="overflow-hidden rounded-md border border-[#e2e8ea]">
      <button type="button" className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left" onClick={() => setOpen((current) => !current)}>
        <span>
          <span className="block font-medium text-teal">{title}</span>
          {hint ? <span className="mt-0.5 block text-xs text-muted">{hint}</span> : null}
        </span>
        <HiOutlineChevronDown size={18} className={`shrink-0 text-teal transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="border-t border-[#e2e8ea] px-4 py-4">{children}</div>
        </div>
      </div>
    </section>
  );
}

function ValueInput({
  clause,
  entity,
  store,
  onChange,
}: {
  clause: FilterClause;
  entity: EntityId;
  store: ReportStore;
  onChange: (patch: Partial<FilterClause>) => void;
}) {
  const field = fieldOf(entity, clause.field);
  if (!field || clause.op === "empty" || clause.op === "not_empty") return null;
  if (clause.op === "in" && field.options) {
    return (
      <div className="flex flex-wrap gap-2">
        {field.options.map((option) => {
          const active = clause.values.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              className={active ? "btn-chip-active" : "btn-chip"}
              onClick={() =>
                onChange({
                  values: active ? clause.values.filter((item) => item !== option.value) : [...clause.values, option.value],
                })
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>
    );
  }
  if (field.type === "date") {
    if (clause.op === "month" || clause.op === "period") {
      return <DateField mode="month" value={clause.value} onChange={(value) => onChange({ value })} />;
    }
    if (clause.op === "between") {
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <DateField value={clause.value} onChange={(value) => onChange({ value })} />
          <DateField value={clause.value2} onChange={(value) => onChange({ value2: value })} />
        </div>
      );
    }
    return <DateField value={clause.value} onChange={(value) => onChange({ value })} />;
  }
  if (field.type === "boolean") {
    return <Select value={clause.value} onChange={(value) => onChange({ value })} options={[{ value: "true", label: "Sim" }, { value: "false", label: "Não" }]} placeholder="Selecione" />;
  }
  if (field.type === "enum" && field.options) {
    return <Select value={clause.value} onChange={(value) => onChange({ value })} options={field.options} placeholder="Selecione" />;
  }
  if (field.type === "ref") {
    return <Select value={clause.value} onChange={(value) => onChange({ value })} options={refOptions(store, field.refEntity)} placeholder="Selecione" />;
  }
  if (field.type === "number" && clause.op === "between") {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        <input className={fieldClass} value={clause.value} onChange={(event) => onChange({ value: event.target.value })} placeholder="De" />
        <input className={fieldClass} value={clause.value2} onChange={(event) => onChange({ value2: event.target.value })} placeholder="Até" />
      </div>
    );
  }
  return (
    <input
      className={fieldClass}
      value={clause.value}
      onChange={(event) => onChange({ value: event.target.value })}
      placeholder={field.type === "number" ? "Valor" : "Texto"}
    />
  );
}

function FilterRow({
  clause,
  entity,
  store,
  nested,
  onChange,
  onRemove,
  onAddChild,
}: {
  clause: FilterClause;
  entity: EntityId;
  store: ReportStore;
  nested: boolean;
  onChange: (id: string, patch: Partial<FilterClause>) => void;
  onRemove: (id: string) => void;
  onAddChild: (id: string) => void;
}) {
  const relations = relationsOf(entity);
  const fields = fieldsOf(entity);
  const field = fieldOf(entity, clause.field);
  const kindOptions = nested
    ? [{ value: "field", label: "Campo" }]
    : [{ value: "field", label: "Campo" }, ...(relations.length ? [{ value: "relation", label: "Relação" }] : [])];

  return (
    <div className={`rounded-md border border-[#e2e8ea] p-3 ${nested ? "bg-paper/80" : "bg-white"}`}>
      <div className="grid gap-3 lg:grid-cols-[8rem_1fr_auto]">
        <Select
          value={clause.kind}
          options={kindOptions}
          onChange={(value) => {
            const kind = value as FilterKind;
            onChange(clause.id, {
              kind,
              field: "",
              op: "eq",
              value: "",
              value2: "",
              values: [],
              relationEntity: kind === "relation" ? relations[0]?.entity ?? "" : "",
              children: kind === "relation" ? clause.children : [],
            });
          }}
        />
        {clause.kind === "relation" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              value={clause.relationEntity}
              options={relations.map((item) => ({ value: item.entity, label: item.label }))}
              onChange={(value) => onChange(clause.id, { relationEntity: value as EntityId, children: [] })}
              placeholder="Entidade relacionada"
            />
            <Select
              value={clause.relationMode}
              options={[
                { value: "some", label: "Possui ao menos um" },
                { value: "none", label: "Não possui nenhum" },
              ]}
              onChange={(value) => onChange(clause.id, { relationMode: value === "none" ? "none" : "some" })}
            />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              value={clause.field}
              options={fields.map((item) => ({ value: item.key, label: item.label }))}
              placeholder="Campo"
              onChange={(value) => {
                const next = fieldOf(entity, value);
                onChange(clause.id, {
                  field: value,
                  op: next ? operatorsOf(next.type)[0].value : "eq",
                  value: "",
                  value2: "",
                  values: [],
                });
              }}
            />
            {field ? (
              <Select
                value={clause.op}
                options={operatorsOf(field.type)}
                onChange={(value) => onChange(clause.id, { op: value as FilterClause["op"], value: "", value2: "", values: [] })}
              />
            ) : (
              <div />
            )}
          </div>
        )}
        <button type="button" className="btn-text self-start text-accent" onClick={() => onRemove(clause.id)} aria-label="Remover condição">
          <HiOutlineTrash size={18} />
        </button>
      </div>
      {clause.kind === "field" && field && (
        <div className="mt-3">
          <ValueInput clause={clause} entity={entity} store={store} onChange={(patch) => onChange(clause.id, patch)} />
        </div>
      )}
      {clause.kind === "relation" && clause.relationEntity && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Condições da relação</p>
          {clause.children.map((child) => (
            <FilterRow
              key={child.id}
              clause={child}
              entity={clause.relationEntity as EntityId}
              store={store}
              nested
              onChange={onChange}
              onRemove={onRemove}
              onAddChild={onAddChild}
            />
          ))}
          <button type="button" className="btn-text" onClick={() => onAddChild(clause.id)}>
            <HiOutlinePlus size={16} /> Adicionar condição na relação
          </button>
        </div>
      )}
    </div>
  );
}

export default function ReportBuilder({
  lookups,
  nome,
  onNome,
  definition,
  onDefinition,
  favoriteId,
  onToggleFavorite,
  favoriteBusy,
  preview,
}: {
  lookups: ReportStore;
  nome: string;
  onNome: (value: string) => void;
  definition: ReportDefinition;
  onDefinition: (value: ReportDefinition | ((current: ReportDefinition) => ReportDefinition)) => void;
  favoriteId: string;
  onToggleFavorite: () => void;
  favoriteBusy: boolean;
  preview: ReportResult | null;
}) {
  const unusedColumns = fieldsOf(definition.entity).filter((field) => !definition.columns.includes(field.key));

  function setEntity(entity: EntityId) {
    onDefinition(defaultDefinition(entity));
  }

  function updateFilter(id: string, patch: Partial<FilterClause>) {
    onDefinition((current) => ({ ...current, filters: patchFilters(current.filters, id, patch) }));
  }

  function moveColumn(index: number, delta: number) {
    const next = index + delta;
    if (next < 0 || next >= definition.columns.length) return;
    const columns = [...definition.columns];
    const [item] = columns.splice(index, 1);
    columns.splice(next, 0, item);
    onDefinition((current) => ({ ...current, columns }));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <Field label="Nome do relatório">
            <input className={fieldClass} value={nome} onChange={(event) => onNome(event.target.value)} placeholder="Ex.: Pacientes ativos em outubro" />
          </Field>
        </div>
        <button
          type="button"
          className="btn-text mb-[2px]"
          disabled={favoriteBusy}
          onClick={onToggleFavorite}
          aria-pressed={Boolean(favoriteId)}
          aria-label={favoriteId ? "Remover dos favoritos" : "Favoritar modelo"}
          title={favoriteId ? "Remover dos favoritos" : "Favoritar estes filtros"}
        >
          {favoriteId ? <HiStar size={20} className="text-accent" /> : <HiOutlineStar size={20} />}
        </button>
      </div>
      <Field label="Entidade base">
        <Select value={definition.entity} options={ENTITY_OPTIONS} onChange={(value) => setEntity(value as EntityId)} />
      </Field>
      <p className="text-sm text-muted">{describeReport(definition)}</p>

      <Accordion title="Filtros" hint="Condições da consulta. Fechado até você montar.">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted">Todas as condições entram juntas (E). Use uma relação para filtrar registros ligados.</p>
          <button type="button" className="btn-text" onClick={() => onDefinition((current) => ({ ...current, filters: [...current.filters, emptyFilter()] }))}>
            <HiOutlinePlus size={16} /> Condição
          </button>
        </div>
        <div className="space-y-3">
          {definition.filters.length === 0 ? (
            <Empty>Nenhum filtro. A consulta traz todos os registros desta entidade.</Empty>
          ) : (
            definition.filters.map((clause) => (
              <FilterRow
                key={clause.id}
                clause={clause}
                entity={definition.entity}
                store={lookups}
                nested={false}
                onChange={updateFilter}
                onRemove={(id) => onDefinition((current) => ({ ...current, filters: removeFilter(current.filters, id) }))}
                onAddChild={(id) => onDefinition((current) => ({ ...current, filters: addChild(current.filters, id, emptyFilter()) }))}
              />
            ))
          )}
        </div>
      </Accordion>

      <Accordion title="Colunas" hint="O que aparece no PDF e na consulta.">
        <p className="mb-3 text-sm text-muted">Defina a ordem da esquerda para a direita.</p>
        <div className="space-y-2">
          {definition.columns.map((key, index) => {
            const field = fieldOf(definition.entity, key);
            if (!field) return null;
            return (
              <div key={key} className="flex items-center gap-2 rounded-md bg-paper px-3 py-2">
                <span className="flex-1 text-sm font-medium text-ink">{field.label}</span>
                <button type="button" className="btn-text" disabled={index === 0} onClick={() => moveColumn(index, -1)} aria-label="Subir coluna">
                  <HiOutlineChevronUp size={18} />
                </button>
                <button
                  type="button"
                  className="btn-text"
                  disabled={index === definition.columns.length - 1}
                  onClick={() => moveColumn(index, 1)}
                  aria-label="Descer coluna"
                >
                  <HiOutlineChevronDown size={18} />
                </button>
                <button
                  type="button"
                  className="btn-text text-accent"
                  onClick={() => onDefinition((current) => ({ ...current, columns: current.columns.filter((item) => item !== key) }))}
                  aria-label={`Remover ${field.label}`}
                >
                  <HiOutlineTrash size={18} />
                </button>
              </div>
            );
          })}
        </div>
        {unusedColumns.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {unusedColumns.map((field) => (
              <button
                key={field.key}
                type="button"
                className="btn-chip"
                onClick={() => onDefinition((current) => ({ ...current, columns: [...current.columns, field.key] }))}
              >
                + {field.label}
              </button>
            ))}
          </div>
        )}
      </Accordion>

      <Accordion title="Ordenação" hint="Como os registros entram no resultado.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Ordenar por">
            <Select
              value={definition.sortField}
              options={definition.columns.map((key) => ({ value: key, label: fieldOf(definition.entity, key)?.label ?? key }))}
              onChange={(value) => onDefinition((current) => ({ ...current, sortField: value }))}
              placeholder="Coluna"
            />
          </Field>
          <Field label="Direção">
            <Select
              value={definition.sortDir}
              options={[
                { value: "asc", label: "Crescente" },
                { value: "desc", label: "Decrescente" },
              ]}
              onChange={(value) => onDefinition((current) => ({ ...current, sortDir: value === "desc" ? "desc" : "asc" }))}
            />
          </Field>
        </div>
      </Accordion>

      {preview && (
        <section>
          <h3 className="text-lg font-medium text-teal">Consulta direta</h3>
          <p className="mt-1 text-sm text-muted">{preview.count === 1 ? "1 registro" : `${preview.count} registros`}</p>
          <div className="mt-3">
            {preview.count === 0 ? (
              <Empty>Nenhum registro combina com estes filtros.</Empty>
            ) : (
              <DataTable minWidth={Math.max(520, preview.headers.length * 140)}>
                <thead>
                  <tr>
                    {preview.headers.map((header) => (
                      <Th key={header}>{header}</Th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.table.map((row, index) => (
                    <tr key={index}>
                      {row.map((cell, cellIndex) => (
                        <Td key={`${index}-${cellIndex}`}>{cell}</Td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            )}
          </div>
        </section>
      )}

    </div>
  );
}
