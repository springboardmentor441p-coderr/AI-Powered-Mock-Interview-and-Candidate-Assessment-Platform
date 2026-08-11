import { Stage } from '../lite-api/stage';
import { JsonProtoSerializer } from '../remote/serializer';
import { ListenOptions } from './event_manager';
import { PipelineFlavor, PipelineSourceType } from './pipeline-util';
export declare class CorePipeline {
    readonly serializer: JsonProtoSerializer;
    readonly stages: Stage[];
    readonly listenOptions?: ListenOptions | undefined;
    isCorePipeline: boolean;
    constructor(serializer: JsonProtoSerializer, stages: Stage[], listenOptions?: ListenOptions | undefined);
    getPipelineCollection(): string | undefined;
    getPipelineCollectionGroup(): string | undefined;
    getPipelineCollectionId(): string | undefined;
    getPipelineDocuments(): string[] | undefined;
    getPipelineFlavor(): PipelineFlavor;
    getPipelineSourceType(): PipelineSourceType | 'unknown';
}
export declare function getPipelineSourceType(p: CorePipeline): PipelineSourceType | 'unknown';
export declare function getPipelineCollection(p: CorePipeline): string | undefined;
export declare function getPipelineCollectionGroup(p: CorePipeline): string | undefined;
export declare function getPipelineCollectionId(p: CorePipeline): string | undefined;
export declare function getPipelineDocuments(p: CorePipeline): string[] | undefined;
export declare function getPipelineFlavor(p: CorePipeline): PipelineFlavor;
