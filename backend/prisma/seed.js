const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding HMS database with hospital incident data...');
  const pw = await bcrypt.hash('Admin@123', 10);

  // ── Users ──────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where:  { email: 'admin@hms.com' },
    update: { password: pw },
    create: { name: 'System Admin', email: 'admin@hms.com', password: pw, role: 'admin' }
  });
  const managerICU = await prisma.user.upsert({
    where:  { email: 'manager.icu@hms.com' },
    update: { password: pw },
    create: { name: 'Dr. Sarah Johnson', email: 'manager.icu@hms.com', password: pw, role: 'department_manager', department: 'ICU' }
  });
  const managerED = await prisma.user.upsert({
    where:  { email: 'manager.ed@hms.com' },
    update: { password: pw },
    create: { name: 'Dr. Michael Chen', email: 'manager.ed@hms.com', password: pw, role: 'department_manager', department: 'Emergency Department' }
  });
  const investigator = await prisma.user.upsert({
    where:  { email: 'investigator@hms.com' },
    update: { password: pw },
    create: { name: 'Dr. David Miller', email: 'investigator@hms.com', password: pw, role: 'investigator' }
  });
  const investigator2 = await prisma.user.upsert({
    where:  { email: 'investigator2@hms.com' },
    update: { password: pw },
    create: { name: 'Dr. Priya Sharma', email: 'investigator2@hms.com', password: pw, role: 'investigator' }
  });
  const actionOwner = await prisma.user.upsert({
    where:  { email: 'action.owner@hms.com' },
    update: { password: pw },
    create: { name: 'Nurse Emily Davis', email: 'action.owner@hms.com', password: pw, role: 'action_owner' }
  });
  const actionOwner2 = await prisma.user.upsert({
    where:  { email: 'action.owner2@hms.com' },
    update: { password: pw },
    create: { name: 'Pharmacist James Wilson', email: 'action.owner2@hms.com', password: pw, role: 'action_owner' }
  });
  const staff = await prisma.user.upsert({
    where:  { email: 'staff@hms.com' },
    update: { password: pw },
    create: { name: 'Nurse John Perera', email: 'staff@hms.com', password: pw, role: 'staff' }
  });
  console.log('✅ Users created');

  // ── Incidents ──────────────────────────────────────────────────────────
  const incidentData = [
    // Medication Errors
    {
      title: 'Wrong Medication Dose — ICU Patient Received 10x Morphine',
      description: 'A patient in ICU Bed 4 received 10mg of morphine instead of the prescribed 1mg due to a decimal point error in the medication order. Error caught 30 minutes after administration during routine vitals check. Patient showed respiratory depression, required naloxone. Recovered fully after 4 hours monitoring.',
      severity: 'CRITICAL', category: 'Medication Error', department: 'ICU',
      location: 'ICU Bay 4', status: 'CLOSED', reportedBy: staff.id
    },
    {
      title: 'Penicillin Administered to Documented Allergy Patient',
      description: 'Patient with documented penicillin allergy received amoxicillin 500mg orally. Allergy alert existed in paper records but not transferred to EMR at re-admission. Patient developed urticaria. Antihistamines administered immediately. Allergy documentation gap identified.',
      severity: 'HIGH', category: 'Medication Error', department: 'General Ward',
      location: 'Ward 3B, Bed 12', status: 'CLOSED', reportedBy: staff.id
    },
    {
      title: 'IV Heparin Infusion Rate Error — 10x Overdose',
      description: 'Patient on heparin received 2000 units/hour instead of 200 units/hour due to pump programming error. Identified during nurse handover. PTT critically elevated. Protamine sulfate administered. Patient had no major bleeding events.',
      severity: 'CRITICAL', category: 'Medication Error', department: 'ICU',
      location: 'ICU Bay 7', status: 'INVESTIGATING', reportedBy: staff.id
    },
    {
      title: 'Duplicate Antihypertensive Order — Patient Received Double Dose',
      description: 'Patient admitted for chest pain prescribed amlodipine 10mg by both admitting physician and on-call cardiologist independently. Two doses given before pharmacy reconciliation identified the duplicate. Patient experienced symptomatic hypotension requiring IV fluid resuscitation.',
      severity: 'HIGH', category: 'Medication Error', department: 'Emergency Department',
      location: 'ED Bay 2', status: 'PENDING_ACTION', reportedBy: staff.id
    },
    {
      title: 'Oral Methotrexate Dispensed Daily Instead of Weekly',
      description: 'Patient on weekly oral methotrexate for RA was dispensed medication with incorrect daily dosing instructions. Patient took daily doses for 5 days. Discovered at follow-up appointment. Patient presented with mucositis and elevated LFTs. Hospitalized for leucovorin rescue therapy.',
      severity: 'HIGH', category: 'Medication Error', department: 'Outpatient Clinic',
      location: 'Outpatient Pharmacy', status: 'UNDER_REVIEW', reportedBy: staff.id
    },
    // Patient Falls
    {
      title: 'Elderly Patient Fall — Hip Fracture During Unassisted Bathroom Visit',
      description: '82-year-old patient with high fall risk (Morse Scale 75) attempted unassisted bathroom visit at 02:30. Patient fell and sustained left hip fracture. Bed alarm had malfunctioned and was not alerting. Call bell was accessible but not used.',
      severity: 'HIGH', category: 'Patient Fall', department: 'General Ward',
      location: 'Ward 2A, Room 204 Bathroom', status: 'CLOSED', reportedBy: staff.id
    },
    {
      title: 'Post-Operative Patient Fell Climbing Over Bedrails — Head Injury',
      description: 'Patient 6 hours post-appendectomy became confused due to opioid analgesia, climbed over raised bedrails and fell, striking head. CT showed no intracranial pathology. Nursing staff were responding to another emergency.',
      severity: 'HIGH', category: 'Patient Fall', department: 'General Ward',
      location: 'Surgical Ward 5, Bed 8', status: 'CLOSED', reportedBy: staff.id
    },
    {
      title: 'Stroke Patient Fell During Wheelchair-to-Bed Transfer',
      description: 'During afternoon transfer, wheelchair footrests were not folded away. Patient foot caught and they fell forward. One nurse was assisting — two-person protocol was required per care plan. Patient sustained bruising to left knee. No fractures on imaging.',
      severity: 'MEDIUM', category: 'Patient Fall', department: 'General Ward',
      location: 'Rehabilitation Ward 4, Room 407', status: 'INVESTIGATING', reportedBy: staff.id
    },
    {
      title: 'ICU Patient Self-Extubated and Fell During Delirium Episode',
      description: 'Delirious ICU patient removed endotracheal tube and IV lines, attempted to ambulate, fell at bedside. Emergency re-intubation required. Wrist restraints had been removed as patient appeared calm. Delirium screening score had increased in preceding 24 hours.',
      severity: 'CRITICAL', category: 'Patient Fall', department: 'ICU',
      location: 'ICU Bed 2', status: 'PENDING_ACTION', reportedBy: staff.id
    },
    {
      title: 'Outpatient Slipped on Wet Floor — Wrist Fracture',
      description: 'Outpatient attending morning clinic slipped on wet floor near radiology department. Wet floor sign was present at one end but not visible from patient approach direction. Patient sustained Colles fracture of right wrist. Cleaning staff placed signs at only one end of spill.',
      severity: 'MEDIUM', category: 'Patient Fall', department: 'Outpatient Clinic',
      location: 'Main Corridor, Level 2 near Radiology', status: 'OPEN', reportedBy: staff.id
    },
    // Surgical Complications
    {
      title: 'Retained Surgical Swab Discovered Post-Operatively',
      description: 'Patient who underwent emergency laparotomy presented 4 days later with fever and abdominal pain. CT revealed retained swab in right lower quadrant. Patient returned to theatre for removal. Pre/post-operative swab counts had matched — count was not independently verified by two nurses.',
      severity: 'CRITICAL', category: 'Surgical Complication', department: 'Operating Theatre',
      location: 'OT Suite 3', status: 'CLOSED', reportedBy: staff.id
    },
    {
      title: 'Wrong-Site Surgery — Left Knee Operated Instead of Right',
      description: 'Patient scheduled for right knee arthroscopy had left knee prepped. Error discovered when surgeon noticed absence of correct site marking. Surgery halted immediately. No significant injury beyond initial incision. WHO Safe Surgery Checklist not completed.',
      severity: 'CRITICAL', category: 'Surgical Complication', department: 'Operating Theatre',
      location: 'OT Suite 1', status: 'CLOSED', reportedBy: admin.id
    },
    {
      title: 'Intraoperative Anaphylaxis to Latex — Undisclosed Sensitivity',
      description: 'Patient with undisclosed latex sensitivity developed anaphylactic shock during elective cholecystectomy. Latex allergy not documented in pre-operative assessment and not communicated to intraoperative team. Responded to epinephrine and steroids. Recovered fully in ICU.',
      severity: 'HIGH', category: 'Surgical Complication', department: 'Operating Theatre',
      location: 'OT Suite 2', status: 'UNDER_REVIEW', reportedBy: staff.id
    },
    {
      title: 'Post-Op MRSA Wound Infection After Hip Replacement',
      description: 'Patient developed deep wound infection 10 days post total hip replacement. MRSA isolated from wound cultures. Required surgical debridement and prolonged IV vancomycin. Environmental OT swabs showed MRSA contamination. Enhanced cleaning protocols implemented.',
      severity: 'HIGH', category: 'Surgical Complication', department: 'Operating Theatre',
      location: 'OT Suite 4', status: 'INVESTIGATING', reportedBy: staff.id
    },
    // Infection Control
    {
      title: 'Norovirus Outbreak — 8 Patients Affected in Geriatric Ward',
      description: 'Eight geriatric ward patients developed acute gastroenteritis over 48 hours. Norovirus confirmed in 6 cases. Shared commode not adequately decontaminated between patients. Ward cohorting implemented and closed to new admissions for 72 hours.',
      severity: 'HIGH', category: 'Infection Control', department: 'General Ward',
      location: 'Ward 6 — Geriatric Unit', status: 'CLOSED', reportedBy: staff.id
    },
    {
      title: 'CLABSI — Central Line Day 12 ICU Patient',
      description: 'ICU patient developed fever, rigors. Blood cultures positive for Staphylococcus epidermidis. CLABSI confirmed. Central line removed, IV antibiotics for 14 days. Bundle compliance checklist not completed at time of line insertion.',
      severity: 'HIGH', category: 'Infection Control', department: 'ICU',
      location: 'ICU Bed 9', status: 'CLOSED', reportedBy: staff.id
    },
    {
      title: 'PPE Protocol Breach in TB Isolation Room',
      description: 'Staff nurse observed healthcare assistant entering airborne isolation room (suspected TB) wearing only surgical mask, not N95 respirator. HCA confirmed had run out of N95 masks and did not report this. N95 supply in anteroom depleted.',
      severity: 'HIGH', category: 'Infection Control', department: 'General Ward',
      location: 'Isolation Room 101, Ward 3', status: 'ACCEPTED', reportedBy: staff.id
    },
    {
      title: 'Needlestick Injury — Uncapped Needle in Waste Bin',
      description: 'Domestic services worker sustained needlestick injury removing waste bag from clinical bin in ED. Uncapped needle placed in general clinical waste instead of sharps container. Worker started needlestick protocol. Source patient HIV negative.',
      severity: 'HIGH', category: 'Infection Control', department: 'Emergency Department',
      location: 'ED Treatment Bay 5', status: 'OPEN', reportedBy: staff.id
    },
    // Equipment Failures
    {
      title: 'Ventilator Alarm Failure During Night Shift',
      description: 'ICU ventilator high-pressure alarm failed during patient coughing and partial circuit disconnection. Manual backup alarm also did not trigger. Bedside nurse noted desaturation on central monitor within 90 seconds. Ventilator removed from service for biomedical review. No patient harm.',
      severity: 'HIGH', category: 'Equipment Failure', department: 'ICU',
      location: 'ICU Bay 11', status: 'CLOSED', reportedBy: staff.id
    },
    {
      title: 'Infusion Pump Malfunction — Noradrenaline Delivered at 4x Rate',
      description: 'Infusion pump delivering noradrenaline began running at ~4x set rate. Nurse noticed sharp BP rise on monitor. Pump stopped and replaced immediately. Biomedical review found faulty motor control board. Patient experienced temporary severe hypertension but recovered.',
      severity: 'CRITICAL', category: 'Equipment Failure', department: 'ICU',
      location: 'ICU Bay 3', status: 'CLOSED', reportedBy: staff.id
    },
    {
      title: 'Defibrillator Battery Failure During Cardiac Arrest',
      description: 'During cardiac arrest on general ward, crash cart defibrillator failed to power on due to depleted battery. Second defibrillator retrieved, adding ~90 second delay to first shock. ROSC achieved but patient suffered hypoxic brain injury. Battery not checked during three preceding daily equipment checks.',
      severity: 'CRITICAL', category: 'Equipment Failure', department: 'General Ward',
      location: 'Ward 2B, Room 208', status: 'UNDER_REVIEW', reportedBy: staff.id
    },
    // Diagnostic Errors
    {
      title: 'Delayed Pulmonary Embolism Diagnosis — Chest X-Ray Misread',
      description: 'Patient with dyspnoea had chest X-ray reported as normal by ED registrar. Discharged with musculoskeletal pain diagnosis. Re-presented 18 hours later in haemodynamic compromise. CT confirmed massive bilateral PE. Required ICU admission and thrombolysis.',
      severity: 'CRITICAL', category: 'Diagnostic Error', department: 'Emergency Department',
      location: 'ED Assessment Bay', status: 'CLOSED', reportedBy: admin.id
    },
    {
      title: 'Blood Sample Mislabelling — Wrong Cross-Match Results',
      description: 'Blood sample for pre-operative cross-match collected from Patient A but labelled with Patient B details. Error caught at blood bank second-sample protocol. Neither patient received incompatible blood. Labelling error occurred at bedside collection.',
      severity: 'HIGH', category: 'Patient Identification', department: 'Laboratory',
      location: 'Surgical Pre-Op Ward and Haematology Lab', status: 'CLOSED', reportedBy: staff.id
    },
    {
      title: 'Critical Lab Value Not Communicated — Hyperkalaemia 6.8',
      description: 'Critically elevated serum potassium (6.8 mmol/L) reported at 03:15. Lab called ward number on file but ward had relocated. Result uncollected for 3.5 hours until day team reviewed at 06:45. Patient on ECG monitoring throughout, no dysrhythmia.',
      severity: 'HIGH', category: 'Documentation Error', department: 'Laboratory',
      location: 'Pathology Lab and Ward 4A', status: 'INVESTIGATING', reportedBy: staff.id
    },
    {
      title: 'Radiology Report Filed Under Wrong Patient — Appendicitis Delayed',
      description: 'CT abdomen confirming acute appendicitis filed under wrong patient MRN due to data entry error. Treating team did not receive report for 6 hours. Patient underwent emergency appendectomy but presented with perforated appendix due to delay.',
      severity: 'HIGH', category: 'Documentation Error', department: 'Radiology',
      location: 'Radiology Department and ED', status: 'ACCEPTED', reportedBy: staff.id
    },
    // Blood/Transfusion
    {
      title: 'Near-Miss ABO Incompatible Transfusion — WBIT Event',
      description: 'Blood sample collected in tube labelled with wrong patient details (Wrong Blood in Tube). Error identified at bedside pre-transfusion verification by second nurse. Transfusion not commenced. Both patients re-sampled and correct cross-match units prepared.',
      severity: 'CRITICAL', category: 'Blood/Transfusion', department: 'Operating Theatre',
      location: 'Pre-Op Assessment Area', status: 'CLOSED', reportedBy: staff.id
    },
    {
      title: 'Febrile Non-Haemolytic Transfusion Reaction',
      description: 'Patient with chronic anaemia developed FNHTR ~45 minutes into second unit of packed RBCs. Temperature rose to 38.9°C. Transfusion stopped, paracetamol given. Patient recovered within 2 hours. Haemovigilance report filed.',
      severity: 'MEDIUM', category: 'Blood/Transfusion', department: 'General Ward',
      location: 'Day Chemotherapy Unit', status: 'CLOSED', reportedBy: staff.id
    },
    {
      title: 'Transfusion Started Without Written Consent — Post-Partum Haemorrhage',
      description: 'Patient required urgent blood transfusion for PPH. In emergency, transfusion commenced before consent form signed. Patient was conscious and verbally consented. Written consent obtained 20 minutes later. Incident self-reported by midwife. Patient outcome excellent.',
      severity: 'LOW', category: 'Blood/Transfusion', department: 'Maternity',
      location: 'Delivery Suite 3', status: 'OPEN', reportedBy: staff.id
    }
  ];

  console.log(`🏥 Creating ${incidentData.length} hospital incidents...`);
  const created = [];
  for (const d of incidentData) {
    const inc = await prisma.incident.create({ data: d });
    created.push(inc);
  }

  // ── Full lifecycle for CLOSED incidents ───────────────────────────────
  const closedIncs = created.filter(i => i.status === 'CLOSED');
  for (const inc of closedIncs) {
    await prisma.incidentInvestigation.upsert({
      where:  { incidentId: inc.id },
      update: {},
      create: {
        incidentId: inc.id,
        findings:   'Investigation completed. Root cause identified through staff interviews, documentation review, and direct observation of the incident circumstances.',
        evidence:   'Patient records, medication administration records, staff statements, equipment logs reviewed.',
        investigatedBy:    investigator.id,
        investigationDate: new Date()
      }
    });
    await prisma.incidentRootCause.upsert({
      where:  { incidentId: inc.id },
      update: {},
      create: {
        incidentId:          inc.id,
        rootCauseCategory:   'Process/Protocol Gap',
        description:         'Investigation identified failure in adherence to existing protocols and inadequate verification steps at critical decision points.',
        contributingFactors: 'High workload, inadequate handover, system alert fatigue, and insufficient double-check procedures contributed to this incident.',
        causalChain:         'Staff workload → missed verification → protocol deviation → adverse event'
      }
    });
    await prisma.incidentAction.create({
      data: {
        incidentId:  inc.id,
        actionTaken: 'Implement mandatory double-check procedure and update staff training protocols.',
        assignedTo:  actionOwner.id,
        priority:    'HIGH',
        status:      'COMPLETED'
      }
    });
    await prisma.incidentControl.create({
      data: {
        incidentId:  inc.id,
        controlType: 'Preventive',
        description: 'Updated clinical protocol and mandatory staff competency assessment implemented.',
        owner:       actionOwner.id,
        status:      'IMPLEMENTED'
      }
    });
    await prisma.incidentReview.upsert({
      where:  { incidentId: inc.id },
      update: {},
      create: {
        incidentId:          inc.id,
        reviewerId:          managerICU.id,
        reviewNotes:         'All corrective actions implemented and verified. Staff completed updated training. Risk of recurrence significantly reduced.',
        effectivenessRating: 4,
        reviewDate:          new Date()
      }
    });
    await prisma.incidentClosure.upsert({
      where:  { incidentId: inc.id },
      update: {},
      create: {
        incidentId:      inc.id,
        closureSummary:  'Incident fully investigated, root cause identified, corrective actions implemented and verified. Lessons learned documented and shared with clinical team.',
        lessonsLearned:  'Enhanced verification protocols and checklists are essential safety barriers. Staff must feel empowered to pause and verify before proceeding with any high-risk clinical intervention.',
        closedBy:        managerICU.id,
        closureDate:     new Date()
      }
    });
  }

  // INVESTIGATING incidents — assign investigator
  const investigatingIncs = created.filter(i => i.status === 'INVESTIGATING');
  for (const inc of investigatingIncs) {
    await prisma.incidentInvestigation.upsert({
      where:  { incidentId: inc.id },
      update: {},
      create: {
        incidentId:        inc.id,
        findings:          'Investigation in progress. Initial findings documented. Continuing to gather evidence.',
        investigatedBy:    investigator.id,
        investigationDate: new Date()
      }
    });
  }

  // PENDING_ACTION incidents — full investigation + assigned action owner
  const pendingIncs = created.filter(i => i.status === 'PENDING_ACTION');
  for (const inc of pendingIncs) {
    await prisma.incidentInvestigation.upsert({
      where:  { incidentId: inc.id },
      update: {},
      create: {
        incidentId:        inc.id,
        findings:          'Investigation complete. Corrective actions assigned to action owner for implementation.',
        investigatedBy:    investigator.id,
        investigationDate: new Date()
      }
    });
    await prisma.incidentAction.create({
      data: {
        incidentId:  inc.id,
        actionTaken: 'Implement corrective actions as per investigation findings and departmental protocol review.',
        assignedTo:  actionOwner.id,
        priority:    'HIGH',
        status:      'IN_PROGRESS'
      }
    });
  }

  // UNDER_REVIEW — add investigation and review
  const reviewIncs = created.filter(i => i.status === 'UNDER_REVIEW');
  for (const inc of reviewIncs) {
    await prisma.incidentInvestigation.upsert({
      where:  { incidentId: inc.id },
      update: {},
      create: {
        incidentId:     inc.id,
        findings:       'Investigation complete. All corrective actions implemented. Awaiting management review and formal closure.',
        investigatedBy: investigator.id
      }
    });
    await prisma.incidentReview.upsert({
      where:  { incidentId: inc.id },
      update: {},
      create: {
        incidentId:          inc.id,
        reviewerId:          managerICU.id,
        reviewNotes:         'Under review — verifying corrective action effectiveness before closure.',
        effectivenessRating: 3
      }
    });
  }

  console.log('✅ Hospital incidents created with full lifecycle data');
  console.log('\n🏥 Demo Credentials (all passwords: Admin@123):');
  console.log('  Admin:          admin@hms.com');
  console.log('  ICU Manager:    manager.icu@hms.com');
  console.log('  ED Manager:     manager.ed@hms.com');
  console.log('  Investigator:   investigator@hms.com');
  console.log('  Investigator 2: investigator2@hms.com');
  console.log('  Action Owner:   action.owner@hms.com');
  console.log('  Action Owner 2: action.owner2@hms.com');
  console.log('  Staff:          staff@hms.com');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
