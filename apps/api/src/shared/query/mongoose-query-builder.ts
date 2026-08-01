import type { HydratedDocument, Model, QueryFilter } from "mongoose";

import type { QueryOptions, SortOptions } from "./types.js";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export class MongooseQueryBuilder<TDocument extends object> {
  private readonly filterClauses: QueryFilter<TDocument>[] = [];
  private paginationOptions?: QueryOptions["pagination"];
  private sortOptions?: SortOptions;
  private searchOptions?: { fields: readonly (keyof TDocument)[]; value: string };
  private selectFields?: readonly string[];

  public constructor(
    private readonly model: Model<TDocument>,
    baseFilter: QueryFilter<TDocument> = {},
  ) {
    this.filterClauses.push(baseFilter);
  }

  public paginate(options: QueryOptions["pagination"]): this {
    this.paginationOptions = options;
    return this;
  }

  public sort(options: SortOptions): this {
    this.sortOptions = options;
    return this;
  }

  public search(fields: readonly (keyof TDocument)[], value?: string): this {
    if (value) {
      this.searchOptions = { fields, value };
    }

    return this;
  }

  public filters(filters: QueryFilter<TDocument>): this {
    this.filterClauses.push(filters);
    return this;
  }

  public select(fields?: readonly string[]): this {
    this.selectFields = fields;
    return this;
  }

  public async exec(): Promise<HydratedDocument<TDocument>[]> {
    let query = this.model.find(this.buildFilter());

    if (this.paginationOptions) {
      query = query
        .skip(this.paginationOptions.skip)
        .limit(this.paginationOptions.limit);
    }

    if (this.sortOptions) {
      query = query.sort({
        [this.sortOptions.field]: this.sortOptions.direction === "asc" ? 1 : -1,
      });
    }

    if (this.selectFields) {
      query = query.select(this.selectFields.join(" "));
    }

    return query.exec();
  }

  public count(): Promise<number> {
    return this.model.countDocuments(this.buildFilter()).exec();
  }

  private buildFilter(): QueryFilter<TDocument> {
    const clauses = [...this.filterClauses];

    if (this.searchOptions) {
      const search = escapeRegex(this.searchOptions.value);
      clauses.push({
        $or: this.searchOptions.fields.map((field) => ({
          [field]: { $regex: search, $options: "i" },
        })),
      } as QueryFilter<TDocument>);
    }

    return clauses.length === 1 ? clauses[0] : { $and: clauses };
  }
}
