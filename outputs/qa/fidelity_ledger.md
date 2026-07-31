# MandateGuard fidelity ledger

Reference:
`outputs/design/mandateguard_control_room_concept.png`

Verified render:
`outputs/qa/mandateguard_resolved.png`

| Comparison point | Reference evidence | Render evidence | Result |
| --- | --- | --- | --- |
| Information architecture | Sidebar, main control workspace, right inspector | Same three-column control-room anatomy | Matched |
| Core copy | Operations control room, Run control, Demo scenario | Exact English copy after disabling automatic translation | Matched |
| Workflow | Five-stage blue rail with current/pending states | Five-stage rail transitions to all-complete after approval | Matched and interactive |
| Data structure | Selected incident table plus four-node lineage | Same row, values, risk node, connectors, and protected nodes | Matched |
| Palette | True white, ink, cobalt, risk red, success green | Same token roles in the browser render | Matched |
| Typography | Modern grotesk, tabular financial values, compact control text | Inter UI system with tabular summary values and deliberate control sizes | Matched |
| Container model | Open workspace, tables/rails, one inspector | No bento grid; surfaces follow reference hierarchy | Matched |
| Audit state | Timeline ends in pending write-back | Fixture approval ends at 09:45 with three simulated receipts; connected mode performs the catalog mutations | Intentional functional state |
| Responsive behavior | Desktop-first 16:10 control room | Desktop verified; CSS collapses sidebar and inspector below 900px | Implemented |

Above-the-fold copy diff: no unapproved hero, eyebrow, badge, proof row, or
marketing section was added. `DataHub fixture mode` is an intentional safety and
testability disclosure.
