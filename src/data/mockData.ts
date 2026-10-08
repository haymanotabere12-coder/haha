import { SubjectInfo, Question, LiveClass, DocumentMaterial, VideoLesson, Flashcard, TopicMastery } from '../types';

export const SUBJECTS_DATA: SubjectInfo[] = [
  // Grade 8
  {
    id: 'g8_math',
    name: 'Mathematics',
    nameAmharic: 'ሂሳብ',
    level: 'grade_8',
    iconName: 'Calculator',
    description: 'Rational numbers, linear equations, geometry, statistics, and ratio & proportion for Ministry Exam.',
    questionCount: 240,
    totalHours: 32,
    chapters: ['Square Roots & Real Numbers', 'Linear Equations in One Variable', 'Geometric Transformations', 'Data Presentation & Probability'],
    color: 'from-blue-600 to-indigo-700',
  },
  {
    id: 'g8_science',
    name: 'General Science',
    nameAmharic: 'አጠቃላይ ሳይንስ',
    level: 'grade_8',
    iconName: 'Atom',
    description: 'Human organ systems, cells, matter & chemical changes, energy, force & motion, and environment.',
    questionCount: 280,
    totalHours: 36,
    chapters: ['Human Circulatory & Respiratory Systems', 'Elements & Compounds', 'Light and Sound Energy', 'Ecosystem Conservation'],
    color: 'from-emerald-600 to-teal-700',
  },
  {
    id: 'g8_english',
    name: 'English',
    nameAmharic: 'እንግሊዝኛ',
    level: 'grade_8',
    iconName: 'BookOpen',
    description: 'Reading comprehension, tenses, conditional sentences, active & passive voice, and vocabulary.',
    questionCount: 220,
    totalHours: 28,
    chapters: ['Tenses & Aspects', 'Conditionals & Modals', 'Ministry Reading Passages', 'Collocations & Synonyms'],
    color: 'from-amber-600 to-orange-700',
  },
  {
    id: 'g8_social',
    name: 'Social Studies',
    nameAmharic: 'ህብረተሰብ ጥናት',
    level: 'grade_8',
    iconName: 'Globe',
    description: 'Physical geography of Ethiopia & Horn of Africa, medieval Ethiopian history, and civic awareness.',
    questionCount: 190,
    totalHours: 24,
    chapters: ['Topography & Drainage of Ethiopia', 'History of Ancient States in the Horn', 'Constitutional Rights & Civic Duties'],
    color: 'from-rose-600 to-red-700',
  },

  // Grade 12 Natural Science
  {
    id: 'g12_physics',
    name: 'Physics (Natural)',
    nameAmharic: 'ፊዚክስ',
    level: 'grade_12_natural',
    iconName: 'Zap',
    description: 'Vectors, 2D Mechanics, Electromagnetism, Thermodynamics, Optics, and Modern Physics for ESSLCE.',
    questionCount: 450,
    totalHours: 65,
    chapters: ['Rotational Dynamics & Equilibrium', 'Electric Fields & Potential', 'Magnetic Induction & AC Circuits', 'Wave Nature of Light & Relativity'],
    color: 'from-indigo-600 to-cyan-700',
  },
  {
    id: 'g12_math_nat',
    name: 'Mathematics (Natural)',
    nameAmharic: 'የተፈጥሮ ሳይንስ ሂሳብ',
    level: 'grade_12_natural',
    iconName: 'Sigma',
    description: 'Limits and continuity, derivatives & applications, integrals, vectors in space, and matrices.',
    questionCount: 520,
    totalHours: 75,
    chapters: ['Limits & Differentiation', 'Integration Techniques & Areas', 'Coordinate Geometry of Conics', 'Complex Numbers & Vectors in 3D'],
    color: 'from-violet-600 to-purple-800',
  },
  {
    id: 'g12_chemistry',
    name: 'Chemistry (Natural)',
    nameAmharic: 'ኬሚስትሪ',
    level: 'grade_12_natural',
    iconName: 'FlaskConical',
    description: 'Chemical kinetics, chemical equilibrium, acid-base theories, electrochemistry, and organic reactions.',
    questionCount: 410,
    totalHours: 58,
    chapters: ['Reaction Rates & Equilibrium', 'Ionic Equilibria in Solutions', 'Galvanic & Electrolytic Cells', 'Polymers & Organic Synthesis'],
    color: 'from-emerald-600 to-teal-800',
  },
  {
    id: 'g12_biology',
    name: 'Biology (Natural)',
    nameAmharic: 'ባዮሎጂ',
    level: 'grade_12_natural',
    iconName: 'Dna',
    description: 'Cell biology, genetics & inheritance, human endocrine and nervous control, ecology, and biotechnology.',
    questionCount: 390,
    totalHours: 50,
    chapters: ['Mendelian & Molecular Genetics', 'Cell Respiration & Photosynthesis', 'Human Physiology & Regulation', 'Biotechnology & Genetic Engineering'],
    color: 'from-green-600 to-emerald-800',
  },
  {
    id: 'g12_aptitude',
    name: 'Scholastic Aptitude (SAT)',
    nameAmharic: 'የአእምሮ ብቃት ፈተና',
    level: 'grade_12_natural',
    iconName: 'BrainCircuit',
    description: 'Verbal reasoning, number series, spatial logic, analytical deduction, and data sufficiency.',
    questionCount: 350,
    totalHours: 40,
    chapters: ['Letter & Number Sequence Logic', 'Syllogisms & Verbal Reasoning', 'Abstract Pattern Matrix', 'Data Interpretation'],
    color: 'from-sky-600 to-blue-800',
  },

  // Grade 12 Social Science
  {
    id: 'g12_economics',
    name: 'Economics (Social)',
    nameAmharic: 'ኢኮኖሚክስ',
    level: 'grade_12_social',
    iconName: 'TrendingUp',
    description: 'Microeconomics (consumer choice, production costs), Macroeconomics (GDP, inflation, fiscal policy).',
    questionCount: 330,
    totalHours: 48,
    chapters: ['Consumer Utility & Elasticity', 'Market Structures (Perfect & Monopoly)', 'National Income Accounting', 'Monetary & Fiscal Policies'],
    color: 'from-amber-600 to-yellow-800',
  },
  {
    id: 'g12_history',
    name: 'History (Social)',
    nameAmharic: 'ታሪክ',
    level: 'grade_12_social',
    iconName: 'Landmark',
    description: 'Modern Ethiopian history (1855 to present), Battle of Adwa, African anti-colonial struggles, Cold War.',
    questionCount: 360,
    totalHours: 52,
    chapters: ['Unification of Modern Ethiopia (Tewodros to Menilek)', 'The Battle of Adwa & Sovereignty', 'The Ethiopian Revolution of 1974', 'Decolonization of Africa'],
    color: 'from-red-600 to-rose-800',
  },
  {
    id: 'g12_geography',
    name: 'Geography (Social)',
    nameAmharic: 'ጂኦግራፊ',
    level: 'grade_12_social',
    iconName: 'Compass',
    description: 'Map reading & aerial photography, relief & climate zones of Ethiopia, population dynamics, GIS basics.',
    questionCount: 310,
    totalHours: 44,
    chapters: ['Topographic Map Skills & Contours', 'Drainage Basins & Rift Valley Lakes', 'Demographic Trends & Urbanization', 'Economic Resources of Ethiopia'],
    color: 'from-teal-600 to-cyan-800',
  },

  // University Exit Exam
  {
    id: 'exit_cs_se',
    name: 'Computer Science & Software Eng.',
    nameAmharic: 'ኮምፒውተር ሳይንስና ሶፍትዌር ምህንድስና',
    level: 'university_exit',
    iconName: 'Terminal',
    description: 'Higher Education Exit Exam: Data Structures, Algorithms, OOP, Database Systems, Software Architecture, OS & Networks.',
    questionCount: 480,
    totalHours: 80,
    chapters: ['Data Structures & Algorithm Complexity', 'Relational DB Design & Normalization', 'Object-Oriented Design & Design Patterns', 'Operating Systems & Distributed Systems', 'Computer Networks & Cybersecurity'],
    color: 'from-blue-700 to-indigo-900',
  },
  {
    id: 'exit_health_med',
    name: 'Medicine & Public Health',
    nameAmharic: 'ህክምና እና የህዝብ ጤና',
    level: 'university_exit',
    iconName: 'HeartPulse',
    description: 'Internal Medicine, Surgery, Pediatrics, Obstetrics & Gynecology, Epidemiology & Public Health Policies.',
    questionCount: 510,
    totalHours: 85,
    chapters: ['Cardiology & Respiratory Medicine', 'Emergency Trauma & Surgical Principles', 'Neonatology & Child Health Protocols', 'Maternal Health & High-Risk Obstetrics', 'Communicable Disease Surveillance (TB/HIV/Malaria)'],
    color: 'from-rose-700 to-pink-900',
  },
  {
    id: 'exit_business_acc',
    name: 'Business Administration & Accounting',
    nameAmharic: 'ቢዝነስ እና ሂሳብ አያያዝ',
    level: 'university_exit',
    iconName: 'Briefcase',
    description: 'Financial Accounting, IFRS, Cost Accounting, Ethiopian Tax Laws, Auditing, Corporate Finance, Strategic Management.',
    questionCount: 440,
    totalHours: 70,
    chapters: ['IFRS Standards & Financial Reporting', 'Cost Accumulation & Variance Analysis', 'Ethiopian Proclamations on VAT & Income Tax', 'Auditing Evidence & Internal Controls', 'Working Capital & Capital Budgeting'],
    color: 'from-emerald-700 to-teal-950',
  },
  {
    id: 'exit_law',
    name: 'Law (LL.B Exit Exam)',
    nameAmharic: 'ህግ ትምህርት',
    level: 'university_exit',
    iconName: 'Scale',
    description: 'Constitutional Law, Criminal Law & Procedure, Civil Code & Contracts, Commercial Code, Human Rights Law in Ethiopia.',
    questionCount: 400,
    totalHours: 65,
    chapters: ['FDRE Constitution & Federalism', 'General Principles of Ethiopian Criminal Code', 'Law of Contracts & Obligations (Civil Code)', 'Commercial Code & Business Organizations', 'Civil & Criminal Procedural Adjudication'],
    color: 'from-amber-700 to-stone-900',
  },
];

export const INITIAL_QUESTIONS: Question[] = [
  // Grade 8 Mathematics
  {
    id: 'q8-m-1',
    subjectId: 'g8_math',
    level: 'grade_8',
    topic: 'Square Roots & Real Numbers',
    year: '2016 E.C. (2024)',
    difficulty: 'Easy',
    isPastExam: true,
    question: 'Which of the following numbers is an irrational number?',
    options: [
      'A) √144',
      'B) √27',
      'C) 3.14',
      'D) 5/9',
    ],
    correctAnswer: 'B',
    explanation: '√144 = 12 (rational). 3.14 is a terminating decimal (314/100, rational). 5/9 is a fraction of integers (rational). √27 = 3√3, which cannot be expressed as a ratio of two integers; therefore, it is irrational.',
    amharicExplanation: '√27 = 3√3 ሙሉ ቁጥር ስላልሆነ እና በሁለት ሙሉ ቁጥሮች ክፍፍል መልክ መፃፍ ስለማይችል ኢ-አመክንዮአዊ (Irrational) ቁጥር ነው።'
  },
  {
    id: 'q8-m-2',
    subjectId: 'g8_math',
    level: 'grade_8',
    topic: 'Linear Equations in One Variable',
    year: '2015 E.C.',
    difficulty: 'Medium',
    isPastExam: true,
    question: 'If 3(2x - 4) = 4x + 8, what is the value of x?',
    options: [
      'A) x = 5',
      'B) x = 8',
      'C) x = 10',
      'D) x = 12',
    ],
    correctAnswer: 'C',
    explanation: 'Expand the left side: 6x - 12 = 4x + 8. Subtract 4x from both sides: 2x - 12 = 8. Add 12 to both sides: 2x = 20. Divide by 2: x = 10.',
    amharicExplanation: '6x - 12 = 4x + 8 -> 2x = 20 -> x = 10.'
  },

  // Grade 8 Science
  {
    id: 'q8-s-1',
    subjectId: 'g8_science',
    level: 'grade_8',
    topic: 'Human Circulatory & Respiratory Systems',
    year: '2016 E.C. (2024)',
    difficulty: 'Easy',
    isPastExam: true,
    question: 'Which chamber of the human heart pumps oxygenated blood directly into the aorta to supply the entire body?',
    options: [
      'A) Right Atrium',
      'B) Right Ventricle',
      'C) Left Atrium',
      'D) Left Ventricle',
    ],
    correctAnswer: 'D',
    explanation: 'The Left Ventricle has the thickest muscular wall and forcefully contracts to pump oxygen-rich blood through the aorta into systemic circulation.',
    amharicExplanation: 'የግራው የልብ ታችኛው ክፍል (Left Ventricle) ኦክስጅን የበለጸገውን ደም በዋናው የደም ቧንቧ (Aorta) በኩል ወደ መላው ሰውነት ይረጫል።'
  },
  {
    id: 'q8-s-2',
    subjectId: 'g8_science',
    level: 'grade_8',
    topic: 'Elements & Compounds',
    year: '2014 E.C.',
    difficulty: 'Medium',
    isPastExam: true,
    question: 'What is the chemical formula for common table salt used in Ethiopian households?',
    options: [
      'A) NaHCO3',
      'B) NaCl',
      'C) CaCO3',
      'D) NaOH',
    ],
    correctAnswer: 'B',
    explanation: 'Sodium chloride (NaCl) is the chemical compound known as table salt.',
  },

  // Grade 12 Physics (ESSLCE)
  {
    id: 'q12-p-1',
    subjectId: 'g12_physics',
    level: 'grade_12_natural',
    topic: 'Rotational Dynamics & Equilibrium',
    year: '2016 E.C. (2024)',
    difficulty: 'Medium',
    isPastExam: true,
    question: 'A solid uniform cylinder and a thin spherical shell, both of identical mass M and radius R, roll down an inclined plane from rest without slipping. Which reaches the bottom first?',
    options: [
      'A) The spherical shell, because it possesses greater moment of inertia',
      'B) The solid cylinder, because its moment of inertia is smaller (1/2 MR² vs 2/3 MR²)',
      'C) Both reach the bottom at the exact same instant',
      'D) It depends solely on the angle of inclination of the plane',
    ],
    correctAnswer: 'B',
    explanation: 'Acceleration down an incline is a = g*sin(θ) / (1 + I/(MR²)). For a solid cylinder, I/(MR²) = 0.5. For a thin spherical shell, I/(MR²) = 0.67. Smaller moment of inertia means less rotational kinetic energy consumed, resulting in higher linear acceleration and reaching the bottom first.',
    amharicExplanation: 'የሲሊንደሩ Inertia አነስተኛ (0.5MR²) ስለሆነ በትንሽ የመዞር ተቃውሞ በፍጥነት ይወርዳል።'
  },
  {
    id: 'q12-p-2',
    subjectId: 'g12_physics',
    level: 'grade_12_natural',
    topic: 'Magnetic Induction & AC Circuits',
    year: '2015 E.C.',
    difficulty: 'Hard',
    isPastExam: true,
    question: 'In an RLC series circuit connected to an AC voltage source of frequency ω, resonance occurs when:',
    options: [
      'A) ωL = 1 / (ωC)',
      'B) ωL = ωC',
      'C) Resistance R equals zero',
      'D) Phase angle between current and voltage is 90 degrees',
    ],
    correctAnswer: 'A',
    explanation: 'At resonance, inductive reactance XL equals capacitive reactance XC (ωL = 1/(ωC)). The circuit becomes purely resistive (Z = R), current reaches maximum, and voltage and current are in phase.',
  },
  {
    id: 'q12-p-3',
    subjectId: 'g12_physics',
    level: 'grade_12_natural',
    topic: 'Electric Fields & Potential',
    year: '2014 E.C.',
    difficulty: 'Medium',
    isPastExam: true,
    question: 'Two point charges +q and -q are separated by distance 2d. What is the electric potential at the midpoint between them?',
    options: [
      'A) kq / d',
      'B) 2kq / d',
      'C) 0 V',
      'D) kq / d²',
    ],
    correctAnswer: 'C',
    explanation: 'Electric potential is a scalar quantity: V = V1 + V2 = kq/d + k(-q)/d = 0 V. Notice that while the electric field at the midpoint is non-zero, the net electric potential is strictly zero.',
  },

  // Grade 12 Mathematics
  {
    id: 'q12-m-1',
    subjectId: 'g12_math_nat',
    level: 'grade_12_natural',
    topic: 'Limits & Differentiation',
    year: '2016 E.C.',
    difficulty: 'Medium',
    isPastExam: true,
    question: 'What is the limit of (sin(3x)) / x as x approaches 0?',
    options: [
      'A) 0',
      'B) 1',
      'C) 3',
      'D) Undefined',
    ],
    correctAnswer: 'C',
    explanation: 'Using the fundamental trigonometric limit lim(u->0) sin(u)/u = 1: lim(x->0) 3 * [sin(3x)/(3x)] = 3 * 1 = 3.',
  },
  {
    id: 'q12-m-2',
    subjectId: 'g12_math_nat',
    level: 'grade_12_natural',
    topic: 'Integration Techniques & Areas',
    year: '2015 E.C.',
    difficulty: 'Hard',
    isPastExam: true,
    question: 'Evaluate the definite integral ∫ from 0 to 1 of x * e^(x) dx:',
    options: [
      'A) 1',
      'B) e - 1',
      'C) e - 2',
      'D) e',
    ],
    correctAnswer: 'A',
    explanation: 'Integration by parts: let u = x, dv = e^x dx -> du = dx, v = e^x. ∫ x e^x dx = x e^x - ∫ e^x dx = x e^x - e^x. Evaluated from 0 to 1: (1*e^1 - e^1) - (0*e^0 - e^0) = 0 - (-1) = 1.',
  },

  // Grade 12 Biology
  {
    id: 'q12-b-1',
    subjectId: 'g12_biology',
    level: 'grade_12_natural',
    topic: 'Mendelian & Molecular Genetics',
    year: '2016 E.C.',
    difficulty: 'Medium',
    isPastExam: true,
    question: 'If a man with heterozygous blood type A (I^A i) marries a woman with blood type AB (I^A I^B), what is the probability that their first child will have blood type B?',
    options: [
      'A) 0%',
      'B) 25%',
      'C) 50%',
      'D) 75%',
    ],
    correctAnswer: 'B',
    explanation: 'The gametes of the father are I^A and i. The mother produces I^A and I^B. The offspring genotypes are: I^A I^A (Type A, 25%), I^A I^B (Type AB, 25%), I^A i (Type A, 25%), and I^B i (Type B, 25%). Hence, the probability of blood type B is 1/4 or 25%.',
  },

  // Grade 12 Economics
  {
    id: 'q12-e-1',
    subjectId: 'g12_economics',
    level: 'grade_12_social',
    topic: 'Consumer Utility & Elasticity',
    year: '2016 E.C.',
    difficulty: 'Easy',
    isPastExam: true,
    question: 'If a 10% increase in the price of coffee leads to a 15% decrease in the quantity demanded, the price elasticity of demand is:',
    options: [
      'A) 0.67 (Inelastic)',
      'B) 1.00 (Unitary elastic)',
      'C) 1.50 (Elastic)',
      'D) Perfectly elastic',
    ],
    correctAnswer: 'C',
    explanation: 'Price Elasticity of Demand (Ed) = |% change in quantity / % change in price| = |-15% / 10%| = 1.5. Since Ed > 1, demand is classified as elastic.',
  },

  // University Exit Exam: Computer Science & Software Engineering
  {
    id: 'q-exit-cs-1',
    subjectId: 'exit_cs_se',
    level: 'university_exit',
    topic: 'Data Structures & Algorithm Complexity',
    year: '2016 E.C. (July Exit Exam)',
    difficulty: 'Medium',
    isPastExam: true,
    question: 'Which of the following data structures provides an amortized O(1) time complexity for insert, delete, and lookup operations on average?',
    options: [
      'A) Red-Black Balanced Binary Search Tree',
      'B) Hash Table with a well-distributed hash function',
      'C) Binary Min-Heap',
      'D) Doubly Linked List',
    ],
    correctAnswer: 'B',
    explanation: 'Hash tables offer O(1) average case lookup, insertion, and deletion. Red-Black trees offer O(log n) worst-case. Binary heaps offer O(log n) deletion and O(1) find-min.',
  },
  {
    id: 'q-exit-cs-2',
    subjectId: 'exit_cs_se',
    level: 'university_exit',
    topic: 'Relational DB Design & Normalization',
    year: '2016 E.C.',
    difficulty: 'Hard',
    isPastExam: true,
    question: 'A relational database relation R is in Third Normal Form (3NF) if and only if it is in 2NF and:',
    options: [
      'A) Every non-prime attribute is fully functionally dependent on every candidate key',
      'B) No non-prime attribute is transitively dependent on any candidate key',
      'C) There are no multivalued dependencies present in R',
      'D) Every determinant is a superkey',
    ],
    correctAnswer: 'B',
    explanation: '2NF eliminates partial dependencies. 3NF eliminates transitive dependencies between non-prime attributes. Option D describes Boyce-Codd Normal Form (BCNF), which is stricter than 3NF.',
  },
  {
    id: 'q-exit-cs-3',
    subjectId: 'exit_cs_se',
    level: 'university_exit',
    topic: 'Object-Oriented Design & Design Patterns',
    year: '2015 E.C.',
    difficulty: 'Medium',
    isPastExam: true,
    question: 'Which GoF design pattern defines a family of algorithms, encapsulates each one, and makes them interchangeable at runtime?',
    options: [
      'A) Factory Method Pattern',
      'B) Observer Pattern',
      'C) Strategy Pattern',
      'D) Decorator Pattern',
    ],
    correctAnswer: 'C',
    explanation: 'The Strategy Pattern lets the algorithm vary independently from the clients that use it by defining an abstraction and concrete implementations.',
  },

  // University Exit Exam: Medicine & Health
  {
    id: 'q-exit-med-1',
    subjectId: 'exit_health_med',
    level: 'university_exit',
    topic: 'Cardiology & Respiratory Medicine',
    year: '2016 E.C.',
    difficulty: 'Hard',
    isPastExam: true,
    question: 'A 58-year-old male presents to the Emergency Department in Tikur Anbessa Hospital with severe retrosternal chest pain radiating to his left jaw. ECG reveals 3mm ST-segment elevation in leads II, III, and aVF. Which coronary artery is most likely occluded?',
    options: [
      'A) Left Anterior Descending (LAD) Artery',
      'B) Right Coronary Artery (RCA)',
      'C) Left Circumflex (LCx) Artery',
      'D) Left Main Coronary Trunk',
    ],
    correctAnswer: 'B',
    explanation: 'ST elevation in leads II, III, and aVF denotes an Inferior Wall Myocardial Infarction, which in approximately 85-90% of individuals is supplied by the Right Coronary Artery (RCA).',
  },

  // University Exit Exam: Law
  {
    id: 'q-exit-law-1',
    subjectId: 'exit_law',
    level: 'university_exit',
    topic: 'FDRE Constitution & Federalism',
    year: '2016 E.C.',
    difficulty: 'Medium',
    isPastExam: true,
    question: 'Under the 1995 FDRE Constitution of Ethiopia, which organ possesses the supreme constitutional mandate to interpret constitutional disputes?',
    options: [
      'A) The Federal Supreme Court (Cassation Bench)',
      'B) The House of Federation (HoF)',
      'C) The House of Peoples\' Representatives (HoPR)',
      'D) The Federal High Court',
    ],
    correctAnswer: 'B',
    explanation: 'Pursuant to Article 62(1) and Article 83 of the FDRE Constitution, the House of Federation (HoF), advised by the Council of Constitutional Inquiry (CCI), is endowed with the ultimate power to interpret the Constitution.',
  },
];

export const LIVE_CLASSES_DATA: LiveClass[] = [
  {
    id: 'live-1',
    title: 'Grade 12 Physics: Mastering Electromagnetism & Induced EMF',
    subject: 'Physics',
    subjectId: 'g12_physics',
    level: 'grade_12_natural',
    teacherName: 'Ato Birhanu Tadesse',
    teacherTitle: 'Senior ESSLCE National Exam Examiner & Physics Lecturer',
    teacherAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isLiveNow: true,
    scheduledTime: 'Now (Started 18 mins ago)',
    durationMinutes: 75,
    currentViewers: 28,
    currentTopic: 'Faraday’s Law, Lenz’s Law Sign Convention & AC Generator Calculation Patterns',
    slides: [
      {
        title: 'Faraday’s Law of Electromagnetic Induction',
        bulletPoints: [
          'Induced EMF (ε) = -N * (ΔΦ_B / Δt), where Φ_B = B · A · cos(θ)',
          'The negative sign represents Lenz’s Law: induced current creates magnetic field opposing the change in original flux.',
          'Crucial exam trap: Don\'t forget the angle θ is between the Magnetic Field B and the NORMAL vector to the loop plane!',
        ],
        formulaOrQuote: 'ε = -N · dΦ_B / dt',
        diagramDescription: 'Coil rotating in uniform B-field showing sinusoidal voltage waveform.',
      },
      {
        title: 'High-Yield ESSLCE Exam Problem Walkthrough',
        bulletPoints: [
          'A rectangular coil of 200 turns, area 0.05 m², rotates at 60 rev/s in a 0.4 T magnetic field.',
          'Maximum EMF ε_max = N · B · A · ω, where ω = 2πf = 120π rad/s.',
          'ε_max = 200 × 0.4 × 0.05 × (120π) = 480π Volts ≈ 1,507.9 V.',
          'Common pitfall: Leaving frequency in rev/s instead of converting to angular frequency ω (rad/s).',
        ],
        formulaOrQuote: 'ε_max = N · B · A · ω',
      },
      {
        title: 'Self-Induction & Energy Stored in Inductors',
        bulletPoints: [
          'Self-induced EMF: ε_L = -L (dI/dt)',
          'Energy stored in a magnetic field: U_B = 1/2 · L · I²',
          'Compare with electrostatic energy in capacitor: U_E = 1/2 · C · V²',
        ],
        formulaOrQuote: 'U_B = 1/2 · L · I²',
      },
    ],
    pollQuestion: {
      id: 'poll-1',
      question: 'If the speed of rotation of an AC generator is doubled, what happens to the maximum induced EMF?',
      options: ['Remains unchanged', 'It is doubled', 'It is quadrupled', 'It is halved'],
      votes: [4, 19, 3, 2],
    },
    hasRecording: true,
    recordingDuration: '1h 18m',
    materialsAttached: ['Unit_4_Electromagnetism_Summary_Notes.pdf', '2016_ESSLCE_Physics_Worked_Solutions.pdf'],
    youtubeId: 'wR2R8e74V2w',
  },
  {
    id: 'live-social-1',
    title: 'Grade 12 Geography & History: Ethiopian Drainage Systems & 2016 ESSLCE Analysis',
    subject: 'Geography & History',
    subjectId: 'g12_geo',
    level: 'grade_12_social',
    teacherName: 'W/ro Aster Worku',
    teacherTitle: 'Lead Social Science Department Head & Curriculum Author',
    teacherAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    isLiveNow: true,
    scheduledTime: 'Live Right Now',
    durationMinutes: 80,
    currentViewers: 34,
    currentTopic: 'Major Ethiopian River Basins (Abbay, Baro-Akobo, Omo-Gibe) & Continental Rifting',
    slides: [
      {
        title: 'Ethiopian River Basins & Water Towers of East Africa',
        bulletPoints: [
          'Western (Mediterranean) Drainage: Abbay, Tekeze, Baro-Akobo carry over 70% of Ethiopia\'s annual runoff water.',
          'Rift Valley Internal Drainage: Awash River, Lake Ziway, Shala, Langano and Abijatta.',
          'Southeastern Drainage: Genale-Dawa and Wabi Shebelle flowing into the Indian Ocean basin.',
          'Exam question favorite: Why is the Baro river the only navigable river in Ethiopia?',
        ],
        formulaOrQuote: 'Annual Runoff ≈ 124 Billion Cubic Meters',
        diagramDescription: 'Topographical map of Ethiopian Highlands and River Basins.',
      },
      {
        title: 'Geological Formation of the Great East African Rift Valley',
        bulletPoints: [
          'Tectonic divergence between the Nubian and Somali plates.',
          'Afar Triple Junction: Intersection of Red Sea Ridge, Gulf of Aden Ridge, and Main Ethiopian Rift.',
          'Volcanic landforms, crater lakes (Bishoftu) and thermal hot springs (Wondo Genet).',
        ],
        formulaOrQuote: 'Plate Divergence Rate: ~6 to 7 mm/year',
      }
    ],
    pollQuestion: {
      id: 'poll-social-1',
      question: 'Which Ethiopian river carries the largest volume of water discharge annually?',
      options: ['Awash River', 'Abbay (Blue Nile)', 'Baro-Akobo', 'Wabi Shebelle'],
      votes: [3, 23, 6, 2],
    },
    hasRecording: true,
    recordingDuration: '1h 10m',
    materialsAttached: ['Ethiopian_Geography_Drainage_Basins.pdf', 'Grade12_History_Unit3_Summary.pdf'],
    youtubeId: 'b1-xJ3Bw1hE',
  },
  {
    id: 'live-2',
    title: 'University Exit Exam Prep: Full Stack & System Design Principles',
    subject: 'Computer Science & Software Eng.',
    subjectId: 'exit_cs_se',
    level: 'university_exit',
    teacherName: 'Dr. Selamawit Bekele',
    teacherTitle: 'Associate Professor of Computer Science, AAU',
    teacherAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    isLiveNow: true,
    scheduledTime: 'Live Right Now',
    durationMinutes: 90,
    currentViewers: 22,
    currentTopic: 'Database Normalization (1NF to BCNF) & Distributed Caching Architectures',
    slides: [
      {
        title: 'Exit Exam Core Competency: Relational Design',
        bulletPoints: [
          'Decomposition without loss of information (Lossless-Join)',
          'Dependency Preservation guarantees',
          'ACID properties vs BASE in modern distributed systems',
        ],
      },
      {
        title: 'High-Concurrency System Design Patterns',
        bulletPoints: [
          'Load Balancing strategies: Round Robin, Least Connections, IP Hash',
          'Database replication: Primary-Replica read/write splitting',
          'Caching layer with Redis & Cache Invalidation strategies (Cache-Aside, Write-Through)',
        ],
        formulaOrQuote: 'CAP Theorem: Consistency, Availability, Partition Tolerance',
      }
    ],
    pollQuestion: {
      id: 'poll-cs-1',
      question: 'Which Normal Form eliminates transitive functional dependencies on the primary key?',
      options: ['1NF', '2NF', '3NF', 'BCNF'],
      votes: [2, 4, 14, 2],
    },
    hasRecording: true,
    recordingDuration: '1h 32m',
    materialsAttached: ['Exit_Exam_CS_Core_Compendium.pdf'],
    youtubeId: 'bUHFg8CZFCA',
  },
  {
    id: 'live-3',
    title: 'Grade 8 Ministry Exam: Top 50 Mathematics Problem Tricks',
    subject: 'Mathematics',
    subjectId: 'g8_math',
    level: 'grade_8',
    teacherName: 'Ustaz Ahmed Nur',
    teacherTitle: 'Ministry Exam Top Mentor',
    teacherAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    isLiveNow: true,
    scheduledTime: 'Live Right Now',
    durationMinutes: 60,
    currentViewers: 31,
    currentTopic: 'Linear inequalities, word problems on ages, speed-distance-time',
    slides: [
      {
        title: 'Shortcut Strategies for Grade 8 Regional Exam',
        bulletPoints: [
          'Eliminating impossible multiple choice options in under 15 seconds',
          'Fast checking techniques using integer parity',
          'Cross-multiplication shortcuts for linear equations',
        ],
        formulaOrQuote: 'Speed = Distance / Time ; Work = Rate × Time',
      },
      {
        title: 'Geometry & Perimeter/Area of Composite Figures',
        bulletPoints: [
          'Trapezoid Area = 1/2 × (a + b) × h',
          'Circle Area = πr², Circumference = 2πr (use π ≈ 22/7 or 3.14)',
          'Pythagorean theorem in 3-4-5 and 5-12-13 right triangles',
        ],
        formulaOrQuote: 'a² + b² = c²',
      }
    ],
    pollQuestion: {
      id: 'poll-g8-1',
      question: 'If a car travels at 60 km/h for 2 hours and 30 minutes, what is the total distance covered?',
      options: ['120 km', '135 km', '150 km', '180 km'],
      votes: [2, 3, 23, 3],
    },
    hasRecording: true,
    recordingDuration: '1h 05m',
    materialsAttached: ['Grade_8_Math_Formulas_Amharic_English.pdf'],
    youtubeId: '9bZkp7q19f0',
  },
];

export const INITIAL_CHAT_MESSAGES: Record<string, any[]> = {
  'live-1': [
    {
      id: 'm1',
      sender: 'Kalkidan Mengistu',
      role: 'student',
      text: 'Teacher, in the ESSLCE 2016 exam, was the AC generator question asking for peak voltage or RMS voltage?',
      timestamp: '18:04',
      isQuestion: true,
      upvotes: 24,
      isAnswered: true,
    },
    {
      id: 'm2',
      sender: 'Ato Birhanu Tadesse',
      role: 'teacher',
      text: 'Excellent question Kalkidan! Unless the question explicitly mentions "RMS" or "effective", the formula ε_max = NABω calculates the PEAK (maximum) voltage. For RMS, divide by √2!',
      timestamp: '18:06',
      upvotes: 48,
    },
    {
      id: 'm3',
      sender: 'Yonas Abebe',
      role: 'student',
      text: 'Can we also review self-inductance L of a solenoid before the live session ends?',
      timestamp: '18:09',
      isQuestion: true,
      upvotes: 15,
    },
    {
      id: 'm4',
      sender: 'EthioAI Study Copilot',
      role: 'ai_tutor',
      text: 'Quick formula reminder: Solenoid inductance L = (μ₀ · N² · A) / l. Remember that N is squared!',
      timestamp: '18:10',
      upvotes: 31,
    },
  ],
};

export const DOCUMENTS_DATA: DocumentMaterial[] = [
  {
    id: 'doc-math-ch1',
    title: 'Mathematics_Chapter_1.pdf',
    subject: 'Mathematics',
    subjectId: 'g12_math_nat',
    level: 'grade_12_natural',
    chapter: 'Functions, Limits & Continuity',
    category: 'Teacher Summary',
    fileType: 'PDF',
    pages: 28,
    fileSize: '2.4 MB',
    uploadedBy: 'Senior Math Faculty',
    uploadDate: '2026-03-01',
    bookmarked: true,
    downloadsCount: 18450,
    fullExcerpt: `MATHEMATICS CHAPTER 1: FUNCTIONS, LIMITS AND CONTINUITY
1. Function definitions: domain, codomain, range, injection, surjection, bijection.
2. Limit of a function: ε-δ formal definition and algebraic properties.
3. Left-hand and right-hand limits: existence conditions.
4. Continuity at a point x = c: f(c) exists, lim_{x->c} f(x) exists, and lim_{x->c} f(x) = f(c).
5. Intermediate Value Theorem and Extreme Value Theorem proofs.`,
  },
  {
    id: 'doc-phys-notes',
    title: 'Physics_Notes.pdf',
    subject: 'Physics',
    subjectId: 'g12_physics',
    level: 'grade_12_natural',
    chapter: 'Mechanics & Dynamics',
    category: 'Teacher Summary',
    fileType: 'PDF',
    pages: 34,
    fileSize: '3.1 MB',
    uploadedBy: 'Physics Department Lead',
    uploadDate: '2026-02-28',
    bookmarked: true,
    downloadsCount: 15200,
    fullExcerpt: `PHYSICS REVISION NOTES: ESSENTIAL LAWS OF MOTION & ROTATIONAL DYNAMICS
1. Newton's Three Laws:
   - Law of Inertia (F_net = 0 => a = 0)
   - Fundamental Law of Dynamics (F_net = dp/dt = m·a)
   - Action-Reaction Principle (F_AB = -F_BA)
2. Work-Energy Theorem: W_net = ΔK = (1/2)m v_f² - (1/2)m v_i²
3. Conservation of Linear Momentum in collisions: m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂.
4. Rotational kinematics: θ, ω, α and torque τ = I·α.`,
  },
  {
    id: 'doc-chem-slides',
    title: 'Chemistry_Slides.pptx',
    subject: 'Chemistry',
    subjectId: 'g12_chemistry',
    level: 'grade_12_natural',
    chapter: 'Chemical Reactions & Kinetics',
    category: 'Teacher Summary',
    fileType: 'SLIDES',
    pages: 45,
    fileSize: '5.2 MB',
    uploadedBy: 'Dr. Helen Vance',
    uploadDate: '2026-02-20',
    bookmarked: false,
    downloadsCount: 12900,
    fullExcerpt: `CHEMISTRY SLIDES: REACTION MECHANISMS AND EQUILIBRIA
Slide 1: Classification of Chemical Reactions (Redox, Acid-Base, Precipitation).
Slide 2: Reaction Rate Laws: rate = k [A]^m [B]^n.
Slide 3: Arrhenius Equation: k = A e^(-E_a / RT).
Slide 4: Le Chatelier's Principle: effects of concentration, pressure, and temperature.
Slide 5: Buffer solutions and Henderson-Hasselbalch calculation.`,
  },
  {
    id: 'doc-bio-guide',
    title: 'Biology_Study_Guide.pdf',
    subject: 'Biology',
    subjectId: 'g12_biology',
    level: 'grade_12_natural',
    chapter: 'Cell Structure & Genetics',
    category: 'Teacher Summary',
    fileType: 'PDF',
    pages: 52,
    fileSize: '4.8 MB',
    uploadedBy: 'National Biology Committee',
    uploadDate: '2026-02-18',
    bookmarked: true,
    downloadsCount: 17300,
    fullExcerpt: `BIOLOGY COMPREHENSIVE STUDY GUIDE: CELL ORGANELLES & MOLECULAR GENETICS
- Cell membrane lipid bilayer: phospholipids, cholesterol, peripheral and integral proteins.
- Cellular respiration pathways: Glycolysis (cytosol), Krebs Cycle (matrix), Electron Transport Chain (cristae).
- DNA replication: helicase, primase, DNA polymerase III, ligase.
- Transcription and Translation: mRNA codon reading, tRNA anticodons, ribosome subunit binding.`,
  },
  {
    id: 'doc-past-exam',
    title: 'Past_Exam_2022.pdf',
    subject: 'National Exam',
    subjectId: 'g12_physics',
    level: 'grade_12_natural',
    chapter: 'National ESSLCE Past Examination',
    category: 'Ministry Past Papers',
    fileType: 'PDF',
    pages: 60,
    fileSize: '1.9 MB',
    uploadedBy: 'Educational Assessment Agency',
    uploadDate: '2026-01-15',
    bookmarked: true,
    downloadsCount: 31000,
    fullExcerpt: `NATIONAL EXAMINATION OFFICIAL PAST PAPER (2022 G.C.)
Contains 100 authenticated multiple-choice questions with answer key and distribution analysis:
- Section A: Mechanics & Waves (Questions 1 - 30)
- Section B: Electromagnetism & Optics (Questions 31 - 65)
- Section C: Thermodynamics & Modern Physics (Questions 66 - 100)
Includes full answer rationale and examiner notes for Grade 12 students.`,
  },
  {
    id: 'doc-1',
    title: 'Grade 12 Physics Unit 4: Complete Electromagnetism & AC Circuits Booklet',
    subject: 'Physics',
    subjectId: 'g12_physics',
    level: 'grade_12_natural',
    chapter: 'Unit 4: Electromagnetism',
    category: 'Teacher Summary',
    fileType: 'PDF',
    pages: 42,
    fileSize: '4.8 MB',
    uploadedBy: 'Ministry Curriculum Specialist Group',
    uploadDate: '2026-02-15',
    bookmarked: true,
    downloadsCount: 14820,
    fullExcerpt: `ETHIOPIAN SECONDARY SCHOOL LEAVING CERTIFICATE EXAMINATION (ESSLCE)
GRADE 12 PHYSICS MODULE: UNIT 4 ELECTROMAGNETISM

SECTION 1: MAGNETIC FIELDS AND FORCES
When an electric charge q moves with velocity v through a magnetic field B at angle θ, it experiences the Lorentz magnetic force given by:
F_B = q(v × B) = q · v · B · sin(θ).
Key observations:
1. If the charge moves parallel to the magnetic field (θ = 0° or 180°), the magnetic force is identically zero.
2. The magnetic force is always perpendicular to both the velocity vector and the magnetic field. Consequently, magnetic forces do ZERO work on charged particles, meaning kinetic energy and speed remain constant.

SECTION 2: FARADAY'S LAW & INDUCED CURRENT
Magnetic flux Φ_B through a planar surface of area A is defined as:
Φ_B = ∫ B · dA = B · A · cos(θ).
Faraday discovered that whenever magnetic flux linking a circuit changes over time, an electromotive force (EMF) is induced:
ε = -N · (dΦ_B / dt).
Lenz's law provides the physical justification for the negative sign: the induced current flows in a direction such that its own magnetic field opposes the change in flux that produced it (Conservation of Energy).

SECTION 3: AC GENERATORS & TRANSFORMERS
An alternating current generator converts mechanical energy into electrical energy by rotating a coil in a magnetic field. The instantaneous induced EMF is:
ε(t) = ε_max · sin(ωt) = (N · B · A · ω) · sin(ωt).
In an ideal transformer:
V_p / V_s = N_p / N_s = I_s / I_p.
Efficiency η = (P_out / P_in) × 100%.`,
  },
  {
    id: 'doc-2',
    title: 'Ethiopian University Exit Exam: Computer Science Core Syllabus & Model Exam 2024',
    subject: 'Computer Science & Software Eng.',
    subjectId: 'exit_cs_se',
    level: 'university_exit',
    chapter: 'All Exit Exam Domains',
    category: 'Exit Exam Guide',
    fileType: 'PDF',
    pages: 86,
    fileSize: '9.2 MB',
    uploadedBy: 'Ministry of Education (Higher Education Dept.)',
    uploadDate: '2026-01-10',
    bookmarked: true,
    downloadsCount: 22400,
    fullExcerpt: `HIGHER EDUCATION RELEVANCE AND QUALITY AGENCY (HERQA) / MoE
NATIONAL UNIVERSITY EXIT EXAMINATION GUIDELINE FOR COMPUTER SCIENCE & SOFTWARE ENGINEERING

Core Competency Domains Evaluated:
1. Programming & Software Engineering (OOP, Software Architecture, Agile, Design Patterns, Testing)
2. Data Structures & Algorithms (Trees, Graphs, Sorting, Dynamic Programming, Asymptotic Notation)
3. Database Management Systems (ER Modeling, Relational Algebra, SQL, Normalization up to BCNF, Concurrency Control)
4. Operating Systems & System Programming (Process Synchronization, Deadlock handling, Virtual Memory, Paging)
5. Computer Networks & Distributed Systems (OSI/TCP-IP stacks, Routing protocols, Subnetting, Network Security)

EXAM STRUCTURE:
- 100 Multiple Choice Questions (MCQs)
- Time allocated: 3 Hours (180 Minutes)
- Passing threshold: 50% minimum overall score.`,
  },
  {
    id: 'doc-3',
    title: 'Grade 8 Regional Ministry Examination: 5-Year Past Papers Collection (2019-2023 G.C.)',
    subject: 'General Science',
    subjectId: 'g8_science',
    level: 'grade_8',
    chapter: 'Ministry Exam Review',
    category: 'Ministry Past Papers',
    fileType: 'PDF',
    pages: 58,
    fileSize: '6.1 MB',
    uploadedBy: 'Regional Education Bureau',
    uploadDate: '2025-11-20',
    bookmarked: false,
    downloadsCount: 11200,
    fullExcerpt: `REGIONAL EDUCATION BUREAU - GRADE 8 MINISTRY EXAMINATION ARCHIVE
SUBJECT: GENERAL SCIENCE (BIOLOGY, CHEMISTRY, PHYSICS)

UNIT HIGHLIGHTS:
- Cell theory: All living organisms are composed of cells; the cell is the basic structural and functional unit of life.
- Photosynthesis equation: 6CO2 + 6H2O + Sunlight -> C6H12O6 + 6O2.
- Newton's Laws of Motion:
  * First Law (Inertia): An object remains at rest or in uniform motion unless acted upon by an external unbalanced force.
  * Second Law: F_net = m · a.
  * Third Law: For every action, there is an equal and opposite reaction.
- Common chemical separation techniques: Filtration, Evaporation, Distillation, Chromatography.`,
  },
  {
    id: 'doc-4',
    title: 'Grade 12 Mathematics: Calculus Quick Formula Sheet & Theorems (ESSLCE Special)',
    subject: 'Mathematics (Natural)',
    subjectId: 'g12_math_nat',
    level: 'grade_12_natural',
    chapter: 'Calculus (Limits, Derivatives, Integrals)',
    category: 'Formula Sheet',
    fileType: 'PDF',
    pages: 14,
    fileSize: '1.9 MB',
    uploadedBy: 'Addis Ababa Mathematics Teachers Association',
    uploadDate: '2026-03-01',
    bookmarked: true,
    downloadsCount: 19350,
    fullExcerpt: `ESSLCE MATHEMATICS NATURAL SCIENCE CRACKER
DIFFERENTIAL AND INTEGRAL CALCULUS FORMULA COMPENDIUM

1. LIMIT THEOREMS & L'HÔPITAL'S RULE:
- lim(x->0) [sin(kx) / x] = k
- lim(x->0) [(1 - cos(x)) / x] = 0
- lim(x->∞) (1 + 1/x)^x = e
- If lim f(x)/g(x) results in indeterminate forms 0/0 or ∞/∞, apply L'Hôpital: lim f'(x) / g'(x).

2. DERIVATIVE RULES:
- Product Rule: (uv)' = u'v + uv'
- Quotient Rule: (u/v)' = (u'v - uv') / v²
- Chain Rule: d/dx [f(g(x))] = f'(g(x)) · g'(x)
- d/dx [ln(x)] = 1/x, d/dx [e^(kx)] = k · e^(kx)

3. INTEGRATION APPLIED:
- Area between curves y = f(x) and y = g(x) from a to b: A = ∫_a^b |f(x) - g(x)| dx
- Volume of solid of revolution (Disk Method): V = π ∫_a^b [f(x)]² dx.`,
  },
];

export const VIDEO_LESSONS_DATA: VideoLesson[] = [
  {
    id: 'vid-calc-intro',
    title: 'Calculus - Introduction',
    subject: 'Mathematics',
    subjectId: 'g12_math_nat',
    level: 'grade_12_natural',
    chapter: 'Limits & Derivatives',
    instructor: 'Prof. Grant Sanderson',
    duration: '12:45',
    views: 128400,
    youtubeId: 'WUvTyaaNkzM',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnailGradient: 'from-blue-900 via-indigo-900 to-cyan-900',
    timestamps: [
      { time: '00:00', label: 'The Paradox of Instantaneous Rate of Change' },
      { time: '03:15', label: 'Geometry of Derivatives and Tangent Lines' },
      { time: '07:40', label: 'Derivative of x² and Intuition' },
      { time: '10:50', label: 'Integration as the Area Under a Curve' },
    ],
    keyTakeaways: [
      'Calculus is fundamentally the mathematics of change and accumulation.',
      'Derivative measures the instantaneous sensitivity to change of the function value with respect to a change in its argument.',
      'Fundamental Theorem connects derivatives and integrals as inverse operations.',
    ],
    summaryNotes: 'Visual and conceptual guide to calculus fundamentals for high school and university students.',
    saved: true,
  },
  {
    id: 'vid-cell-bio',
    title: 'Cell Structure and Function',
    subject: 'Biology',
    subjectId: 'g12_biology',
    level: 'grade_12_natural',
    chapter: 'Cell Organelles & Membranes',
    instructor: 'Dr. Sarah Mitchell',
    duration: '15:30',
    views: 94200,
    youtubeId: 'URUJD5NEXC8',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnailGradient: 'from-emerald-900 via-teal-900 to-slate-900',
    timestamps: [
      { time: '00:00', label: 'Prokaryotic vs Eukaryotic Cells' },
      { time: '04:10', label: 'Plasma Membrane & Fluid Mosaic Model' },
      { time: '08:45', label: 'Mitochondria, Ribosomes & Golgi Apparatus' },
      { time: '12:20', label: 'Cellular Transport: Active vs Passive' },
    ],
    keyTakeaways: [
      'All living organisms are made up of one or more cells.',
      'Mitochondria perform aerobic cellular respiration to synthesize ATP.',
      'Cell membrane semi-permeability regulates homeostatic ion flow.',
    ],
    summaryNotes: 'Essential for national and entrance biology examinations, covering cell organelles and microscopic transport.',
    saved: true,
  },
  {
    id: 'vid-newton-laws',
    title: "Newton's Laws of Motion",
    subject: 'Physics',
    subjectId: 'g12_physics',
    level: 'grade_12_natural',
    chapter: 'Mechanics & Dynamics',
    instructor: 'Dr. Shini Somara',
    duration: '18:20',
    views: 112000,
    youtubeId: 'kKKM8Y-u7ds',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailGradient: 'from-cyan-950 via-blue-900 to-slate-900',
    timestamps: [
      { time: '00:00', label: 'First Law: Law of Inertia' },
      { time: '05:30', label: 'Second Law: F = ma and Net Force Analysis' },
      { time: '11:15', label: 'Third Law: Action-Reaction Force Pairs' },
      { time: '15:00', label: 'Free Body Diagrams and Inclined Planes' },
    ],
    keyTakeaways: [
      'An object stays at rest or uniform velocity unless acted upon by a nonzero net external force.',
      'Acceleration is directly proportional to net force and inversely proportional to mass.',
      'Action and reaction forces act on different bodies and never cancel each other.',
    ],
    summaryNotes: 'Complete physics review of dynamic laws with solved problem sets and vector diagrams.',
    saved: false,
  },
  {
    id: 'vid-chem-react',
    title: 'Chemical Reactions',
    subject: 'Chemistry',
    subjectId: 'g12_chemistry',
    level: 'grade_12_natural',
    chapter: 'Kinetics & Reaction Types',
    instructor: 'Hank Green',
    duration: '14:10',
    views: 88700,
    youtubeId: '8m6Vt3gkPyE',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnailGradient: 'from-amber-950 via-rose-900 to-purple-950',
    timestamps: [
      { time: '00:00', label: 'Evidence of Chemical Reactions' },
      { time: '03:45', label: 'Balancing Chemical Equations' },
      { time: '07:20', label: 'Precipitation, Acid-Base and Redox Reactions' },
      { time: '11:10', label: 'Activation Energy and Reaction Rates' },
    ],
    keyTakeaways: [
      'Law of Conservation of Mass dictates that atoms are rearranged, not created or destroyed.',
      'Exothermic reactions release heat (ΔH < 0), while endothermic absorb heat (ΔH > 0).',
      'Catalysts speed up rate of reaction by lowering the activation energy barrier.',
    ],
    summaryNotes: 'Core chemistry unit covering synthesis, decomposition, displacement, and redox reactions.',
    saved: false,
  },
  {
    id: 'vid-1',
    title: 'Grade 12 Physics: Complete Electromagnetism in 45 Minutes',
    subject: 'Physics',
    subjectId: 'g12_physics',
    level: 'grade_12_natural',
    chapter: 'Unit 4: Electromagnetism',
    instructor: 'Ato Birhanu Tadesse',
    duration: '44:20',
    views: 38400,
    youtubeId: 'QMQe6Vd_8jE',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnailGradient: 'from-blue-900 via-indigo-800 to-cyan-900',
    timestamps: [
      { time: '00:00', label: 'Introduction & ESSLCE Exam Weight' },
      { time: '05:15', label: 'Magnetic Fields & Right Hand Rule' },
      { time: '14:30', label: 'Faraday’s Law and Lenz’s Law with Experiments' },
      { time: '28:45', label: 'Self-Inductance & Transformers' },
      { time: '38:10', label: 'Previous ESSLCE Questions Solved Step-by-Step' },
    ],
    keyTakeaways: [
      'Magnetic force does no work on moving free charges because force is perpendicular to displacement.',
      'Lenz\'s law sign indicates that induced currents oppose whatever flux change gave rise to them.',
      'Remember transformer ratio: Vp / Vs = Np / Ns = Is / Ip.',
    ],
    summaryNotes: 'Essential for students who want high scores on the ESSLCE National Physics Exam. Focus on magnetic flux equations and AC generator wave mechanics.',
    saved: true,
    isLiveRecording: true,
  },
  {
    id: 'vid-2',
    title: 'University Exit Exam: Top 25 Database & SQL Questions Decoded',
    subject: 'Computer Science & Software Eng.',
    subjectId: 'exit_cs_se',
    level: 'university_exit',
    chapter: 'Relational DB Design & Normalization',
    instructor: 'Dr. Selamawit Bekele',
    duration: '52:10',
    views: 29100,
    youtubeId: 'HXV3zeRR3h4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnailGradient: 'from-slate-900 via-blue-950 to-indigo-900',
    timestamps: [
      { time: '00:00', label: 'Overview of Exit Exam DB Weight (15%)' },
      { time: '07:20', label: '1NF, 2NF, 3NF, and BCNF with Concrete Table Examples' },
      { time: '22:15', label: 'Complex JOINs, GROUP BY, and Subqueries in SQL' },
      { time: '35:40', label: 'Transaction Isolation Levels & Concurrency Anomalies' },
      { time: '46:00', label: 'Mock Exit Exam Multiple Choice Drills' },
    ],
    keyTakeaways: [
      'Functional dependency X -> Y means X uniquely identifies Y.',
      'BCNF requires every determinant to be a candidate key.',
      'Dirty read occurs when a transaction reads uncommitted changes from another transaction.',
    ],
    summaryNotes: 'Covers the exact theoretical and query questions tested in the Ethiopian Higher Education Exit Exam for Computer Science and Software Engineering.',
    saved: true,
  },
  {
    id: 'vid-3',
    title: 'Grade 8 Ministry Exam: Mathematics Geometry & Linear Equations Masterclass',
    subject: 'Mathematics',
    subjectId: 'g8_math',
    level: 'grade_8',
    chapter: 'Linear Equations & Geometry',
    instructor: 'Ustaz Ahmed Nur',
    duration: '38:45',
    views: 45200,
    youtubeId: 'WUvTyaaNkzM',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnailGradient: 'from-emerald-900 via-teal-900 to-stone-900',
    timestamps: [
      { time: '00:00', label: 'Ministry Exam Format & Score Distribution' },
      { time: '08:10', label: 'Solving Multi-Step Equations with Brackets & Fractions' },
      { time: '19:40', label: 'Angles in Parallel Lines, Transversals & Triangles' },
      { time: '30:25', label: 'Common Traps Students Make in Regional Exams' },
    ],
    keyTakeaways: [
      'Always simplify both sides before isolating variables.',
      'Sum of interior angles in an n-sided polygon = (n - 2) * 180 degrees.',
    ],
    summaryNotes: 'Specially created for 8th grade students preparing for the regional ministry examination with explanations in both English and Amharic.',
    saved: false,
  },
];

export const INITIAL_FLASHCARDS: Flashcard[] = [
  {
    id: 'fc-1',
    subject: 'Physics (Natural)',
    level: 'grade_12_natural',
    topic: 'Electromagnetism',
    front: 'State Faraday’s Law of Electromagnetic Induction.',
    back: 'The induced electromotive force (ε) in any closed circuit is equal to the negative time rate of change of magnetic flux through the circuit: ε = -dΦ/dt.',
    difficulty: 'Medium',
    mastered: false,
  },
  {
    id: 'fc-2',
    subject: 'Physics (Natural)',
    level: 'grade_12_natural',
    topic: 'Rotational Dynamics',
    front: 'What is the rotational analog of Newton’s Second Law (F = ma)?',
    back: 'τ_net = I · α (Net Torque equals Moment of Inertia multiplied by Angular Acceleration).',
    difficulty: 'Easy',
    mastered: true,
  },
  {
    id: 'fc-3',
    subject: 'Mathematics (Natural)',
    level: 'grade_12_natural',
    topic: 'Calculus',
    front: 'State the Fundamental Theorem of Calculus (Part 2).',
    back: 'If f is continuous on [a, b] and F is an antiderivative of f, then ∫_a^b f(x) dx = F(b) - F(a).',
    difficulty: 'Medium',
    mastered: true,
  },
  {
    id: 'fc-4',
    subject: 'Computer Science & Software Eng.',
    level: 'university_exit',
    topic: 'Database Systems',
    front: 'What are the ACID properties in database transaction management?',
    back: 'Atomicity (all or nothing), Consistency (preserves integrity rules), Isolation (concurrent executions are independent), Durability (committed changes persist even after crashes).',
    difficulty: 'Medium',
    mastered: false,
  },
  {
    id: 'fc-5',
    subject: 'General Science',
    level: 'grade_8',
    topic: 'Cell Biology',
    front: 'Why is the Mitochondrion called the powerhouse of the cell?',
    back: 'Because it generates most of the chemical energy needed by the cell in the form of ATP (Adenosine Triphosphate) through cellular respiration.',
    difficulty: 'Easy',
    mastered: true,
  },
  {
    id: 'fc-6',
    subject: 'Computer Science & Software Eng.',
    level: 'university_exit',
    topic: 'Data Structures',
    front: 'What is the worst-case time complexity of QuickSort, and how can it be avoided?',
    back: 'Worst-case is O(n²) when the pivot is always the smallest or largest element. It is avoided by using randomized pivot selection or median-of-three partitioning.',
    difficulty: 'Hard',
    mastered: false,
  },
];

export const INITIAL_TOPIC_MASTERY: TopicMastery[] = [
  {
    topic: 'Electromagnetism & AC Induction',
    subject: 'Physics (Natural)',
    level: 'grade_12_natural',
    accuracy: 42,
    questionsAttempted: 38,
    status: 'critical_weak',
    lastPracticed: 'Yesterday',
    suggestedAction: 'Review Unit 4 Live Class recording and practice 15 targeted Faraday\'s Law questions.',
  },
  {
    topic: 'Limits & Differentiation Techniques',
    subject: 'Mathematics (Natural)',
    level: 'grade_12_natural',
    accuracy: 78,
    questionsAttempted: 50,
    status: 'moderate',
    lastPracticed: '2 days ago',
    suggestedAction: 'Focus on trigonometric substitution and L\'Hôpital\'s boundary conditions.',
  },
  {
    topic: 'Relational DB Design & Normalization',
    subject: 'Computer Science & Software Eng.',
    level: 'university_exit',
    accuracy: 48,
    questionsAttempted: 25,
    status: 'critical_weak',
    lastPracticed: '3 days ago',
    suggestedAction: 'Study BCNF vs 3NF loss-less decomposition rules in the Exit Exam compendium.',
  },
  {
    topic: 'Human Circulatory & Respiratory Systems',
    subject: 'General Science',
    level: 'grade_8',
    accuracy: 91,
    questionsAttempted: 35,
    status: 'mastered',
    lastPracticed: 'Today',
    suggestedAction: 'Ready for full mock exam! Maintain streak.',
  },
  {
    topic: 'Mendelian Genetics & Inheritance',
    subject: 'Biology (Natural)',
    level: 'grade_12_natural',
    accuracy: 85,
    questionsAttempted: 40,
    status: 'mastered',
    lastPracticed: '4 days ago',
    suggestedAction: 'Well understood! Re-test dihybrid cross and sex-linked traits once next week.',
  },
  {
    topic: 'Linear Equations & Inequalities',
    subject: 'Mathematics',
    level: 'grade_8',
    accuracy: 54,
    questionsAttempted: 28,
    status: 'moderate',
    lastPracticed: 'Today',
    suggestedAction: 'Practice negative coefficient reversals in inequalities.',
  },
];
