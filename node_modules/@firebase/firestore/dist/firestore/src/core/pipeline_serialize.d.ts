import { Expression } from '../lite-api/expressions';
import { Stage } from '../lite-api/stage';
import { Value as ProtoValue, Stage as ProtoStage } from '../protos/firestore_proto_api';
export declare function stageFromProto(protoStage: ProtoStage): Stage;
export declare function exprFromProto(value: ProtoValue): Expression;
