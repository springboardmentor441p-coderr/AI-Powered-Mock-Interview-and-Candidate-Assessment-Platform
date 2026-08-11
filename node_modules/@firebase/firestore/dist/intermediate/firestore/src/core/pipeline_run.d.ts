import { Document, MutableDocument } from '../model/document';
import { CorePipeline } from './pipeline';
import { QueryOrPipeline } from './pipeline-util';
export type PipelineInputOutput = MutableDocument;
export declare function runPipeline(pipeline: CorePipeline, input: PipelineInputOutput[]): PipelineInputOutput[];
export declare function pipelineMatches(pipeline: CorePipeline, data: PipelineInputOutput): boolean;
export declare function queryOrPipelineMatches(query: QueryOrPipeline, data: PipelineInputOutput): boolean;
export declare function pipelineMatchesAllDocuments(pipeline: CorePipeline): boolean;
export declare function newPipelineComparator(pipeline: CorePipeline): (d1: Document, d2: Document) => number;
export declare function getLastEffectiveLimit(pipeline: CorePipeline): {
    limit: number;
} | undefined;
