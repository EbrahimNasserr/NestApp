import {
  HydratedDocument,
  Model,
  PopulateOptions,
  ProjectionType,
  QueryOptions,
  FlattenMaps,
  RootFilterQuery,
  UpdateQuery,
  UpdateWithAggregationPipeline,
  ModifyResult,
  DeleteResult,
  CreateOptions,
} from 'mongoose';

export type Lean<TDocument> = HydratedDocument<FlattenMaps<TDocument>>;

export abstract class DBRepo<TDocument> {
  constructor(protected readonly model: Model<TDocument>) {}

  async findById({
    id,
    options,
    select,
  }: {
    id: string;
    options?: QueryOptions<TDocument> | null;
    select?: ProjectionType<TDocument> | null;
  }): Promise<TDocument | null | Lean<TDocument>> {
    const document = this.model.findById(id).select(select || '');
    if (options?.populate) {
      document.populate(
        options.populate as PopulateOptions[] | PopulateOptions,
      );
    }
    if (options?.lean) {
      document.lean(options.lean);
    }
    return await document.exec();
  }

  async findOne({
    filter,
    options,
    select,
  }: {
    filter?: RootFilterQuery<TDocument>;
    options?: QueryOptions<TDocument> | null;
    select?: ProjectionType<TDocument> | null;
  }): Promise<TDocument | null | Lean<TDocument>> {
    const document = this.model.findOne(filter).select(select || '');
    if (options?.populate) {
      document.populate(
        options.populate as PopulateOptions[] | PopulateOptions,
      );
    }
    if (options?.lean) {
      document.lean(options.lean);
    }
    return await document.exec();
  }

  async find({
    filter,
    options,
    select,
  }: {
    filter?: RootFilterQuery<TDocument>;
    options?: QueryOptions<TDocument> | null;
    select?: ProjectionType<TDocument> | null;
  }): Promise<TDocument[] | Lean<TDocument>[]> {
    const document = this.model.find(filter || []).select(select || '');
    if (options?.populate) {
      document.populate(
        options.populate as PopulateOptions[] | PopulateOptions,
      );
    }
    if (options?.skip) {
      document.skip(options.skip);
    }
    if (options?.limit) {
      document.limit(options.limit);
    }
    if (options?.lean) {
      document.lean(options.lean);
    }
    if (options?.sort) {
      document.sort(options.sort);
    }
    return await document.exec();
  }

  async paginate({
    filter = {},
    options = {},
    select,
    page = 'all',
    size = 5,
  }: {
    filter?: RootFilterQuery<TDocument>;
    options?: QueryOptions<TDocument> | null;
    select?: ProjectionType<TDocument> | null;
    page?: string | number;
    size?: string | number;
  }): Promise<{
    limit?: number;
    skip?: number;
    data: TDocument[] | Lean<TDocument>[];
    docscount?: number;
    pages?: number;
    currentPage?: string | number;
  }> {
    let docscount: number | undefined = undefined;
    let pages: number | undefined = undefined;
    if (page !== 'all') {
      const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
      const sizeNum = typeof size === 'string' ? parseInt(size, 10) : size;
      const validPage = Math.floor(pageNum < 1 ? 1 : pageNum);
      options = options || {};
      options.limit = Math.floor(sizeNum < 1 || !sizeNum ? 5 : sizeNum);
      options.skip = (validPage - 1) * options.limit;
      docscount = await this.model.countDocuments(filter);
      pages = Math.ceil(docscount / options.limit);
    }
    const document = await this.find({ filter, options, select });
    return {
      limit: options?.limit,
      skip: options?.skip,
      data: document,
      docscount,
      pages,
      currentPage: page,
    };
  }

  async create(
    doc: Partial<TDocument>[],
    options?: CreateOptions,
  ): Promise<any[]> {
    return await this.model.create(doc, options || undefined);
  }

  async insertMany(docs: Partial<TDocument>[]): Promise<any[]> {
    return await this.model.insertMany(docs);
  }

  async updateOne({
    filter,
    update,
    options,
  }: {
    filter: RootFilterQuery<TDocument>;
    update: UpdateQuery<TDocument> | UpdateWithAggregationPipeline;
    options?: any;
  }): Promise<any> {
    return await this.model.updateOne(filter, update, options);
  }

  async findOneAndUpdate({
    filter,
    update,
    options,
  }: {
    filter: RootFilterQuery<TDocument>;
    update: UpdateQuery<TDocument> | UpdateWithAggregationPipeline;
    options?: QueryOptions<TDocument>;
  }): Promise<ModifyResult<TDocument> | TDocument | null> {
    return await this.model.findOneAndUpdate(filter, update, options);
  }

  async findOneAndDelete({
    filter,
    options,
  }: {
    filter: RootFilterQuery<TDocument>;
    options?: QueryOptions<TDocument>;
  }): Promise<TDocument | null> {
    return await this.model.findOneAndDelete(filter, options);
  }

  async findByIdAndUpdate({
    id,
    update,
    options,
  }: {
    id: string;
    update: UpdateQuery<TDocument> | UpdateWithAggregationPipeline;
    options?: QueryOptions<TDocument>;
  }): Promise<TDocument | null> {
    return await this.model.findByIdAndUpdate(id, update, options);
  }

  async deleteOne({
    filter,
    options,
  }: {
    filter: RootFilterQuery<TDocument>;
    options?: any;
  }): Promise<DeleteResult> {
    return await this.model.deleteOne(filter, options);
  }

  async deleteMany({
    filter,
    options,
  }: {
    filter: RootFilterQuery<TDocument>;
    options?: any;
  }): Promise<DeleteResult> {
    return await this.model.deleteMany(filter, options);
  }
}
