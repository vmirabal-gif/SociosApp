export interface Member {
  id: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  dni: string;
  memberType: "standard" | "premium" | "student" | "family";
  familyGroup: string | null;
  status: "active" | "overdue" | "suspended";
  currentDebt: number;
  registrationDate: string;
  birthDate: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

export const memberTypes = [
  { value: "standard", label: "Estándar" },
  { value: "premium", label: "Premium" },
  { value: "student", label: "Estudiante" },
  { value: "family", label: "Familiar" },
] as const;

export const memberStatuses = [
  { value: "active", label: "Activo" },
  { value: "overdue", label: "Moroso" },
  { value: "suspended", label: "Suspendido" },
] as const;

export const mockMembers: Member[] = [
  {
    id: "1",
    memberNumber: "M-001",
    firstName: "Juan",
    lastName: "García",
    dni: "12345678A",
    memberType: "premium",
    familyGroup: "Familia García",
    status: "active",
    currentDebt: 0,
    registrationDate: "2023-01-15",
    birthDate: "1985-06-20",
    phone: "+34 612 345 678",
    email: "juan.garcia@email.com",
    address: "Calle Mayor 123, Madrid",
    notes: "Jugador habitual de tenis",
  },
  {
    id: "2",
    memberNumber: "M-002",
    firstName: "María",
    lastName: "López",
    dni: "23456789B",
    memberType: "standard",
    familyGroup: null,
    status: "active",
    currentDebt: 0,
    registrationDate: "2023-02-20",
    birthDate: "1990-03-15",
    phone: "+34 623 456 789",
    email: "maria.lopez@email.com",
    address: "Avenida Sol 45, Barcelona",
    notes: "",
  },
  {
    id: "3",
    memberNumber: "M-003",
    firstName: "Carlos",
    lastName: "Martínez",
    dni: "34567890C",
    memberType: "student",
    familyGroup: null,
    status: "overdue",
    currentDebt: 150,
    registrationDate: "2023-03-10",
    birthDate: "2002-11-08",
    phone: "+34 634 567 890",
    email: "carlos.martinez@email.com",
    address: "Plaza España 78, Valencia",
    notes: "Estudiante universitario - estudia ingeniería",
  },
  {
    id: "4",
    memberNumber: "M-004",
    firstName: "Ana",
    lastName: "Rodríguez",
    dni: "45678901D",
    memberType: "family",
    familyGroup: "Familia Rodríguez",
    status: "active",
    currentDebt: 0,
    registrationDate: "2022-11-05",
    birthDate: "1988-09-25",
    phone: "+34 645 678 901",
    email: "ana.rodriguez@email.com",
    address: "Calle Norte 34, Sevilla",
    notes: "Contacto principal para membresía familiar",
  },
  {
    id: "5",
    memberNumber: "M-005",
    firstName: "Pedro",
    lastName: "Sánchez",
    dni: "56789012E",
    memberType: "premium",
    familyGroup: null,
    status: "suspended",
    currentDebt: 450,
    registrationDate: "2022-08-15",
    birthDate: "1975-12-01",
    phone: "+34 656 789 012",
    email: "pedro.sanchez@email.com",
    address: "Ronda Sur 89, Bilbao",
    notes: "Suspendido por cuotas impagas - intento de contacto realizado",
  },
  {
    id: "6",
    memberNumber: "M-006",
    firstName: "Laura",
    lastName: "Fernández",
    dni: "67890123F",
    memberType: "standard",
    familyGroup: null,
    status: "active",
    currentDebt: 0,
    registrationDate: "2024-01-08",
    birthDate: "1995-04-18",
    phone: "+34 667 890 123",
    email: "laura.fernandez@email.com",
    address: "Camino Real 56, Málaga",
    notes: "Nuevo socio - clases de natación",
  },
  {
    id: "7",
    memberNumber: "M-007",
    firstName: "Miguel",
    lastName: "Torres",
    dni: "78901234G",
    memberType: "family",
    familyGroup: "Familia Torres",
    status: "overdue",
    currentDebt: 75,
    registrationDate: "2023-06-22",
    birthDate: "1982-07-30",
    phone: "+34 678 901 234",
    email: "miguel.torres@email.com",
    address: "Paseo Marítimo 12, Alicante",
    notes: "Familia de 4 - niños en programa juvenil",
  },
  {
    id: "8",
    memberNumber: "M-008",
    firstName: "Elena",
    lastName: "Navarro",
    dni: "89012345H",
    memberType: "student",
    familyGroup: null,
    status: "active",
    currentDebt: 0,
    registrationDate: "2024-02-14",
    birthDate: "2001-02-14",
    phone: "+34 689 012 345",
    email: "elena.navarro@email.com",
    address: "Universidad 23, Salamanca",
    notes: "Estudiante de medicina - necesita horario flexible",
  },
];
