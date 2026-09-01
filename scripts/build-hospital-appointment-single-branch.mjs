import { outputPath, writeHospitalAppointmentSingleBranchFlow } from "./hospital-appointment-single-branch-flow.mjs";

const doc = writeHospitalAppointmentSingleBranchFlow();

console.log(`Wrote ${outputPath}`);
console.log(`Nodes: ${doc.flow.nodes.length}`);
console.log(`Edges: ${doc.flow.edges.length}`);

