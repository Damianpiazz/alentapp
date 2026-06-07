// PRIMERO: inicializar OpenTelemetry (antes de cualquier otro import)
import './infrastructure/telemetry.js';

import Fastify from 'fastify';
import cors from '@fastify/cors';

import { PostgresMemberRepository } from './infrastructure/PostgresMemberRepository.js';
import { MemberValidator } from './domain/services/MemberValidator.js';
import { CreateMemberUseCase } from './application/NewMemberUseCase.js';
import { GetMembersUseCase } from './application/GetMembersUseCase.js';
import { UpdateMemberUseCase } from './application/UpdateMemberUseCase.js';
import { DeleteMemberUseCase } from './application/DeleteMemberUseCase.js';
import { MemberController } from './delivery/MemberController.js';

import { PostgresEquipmentLoanRepository } from './infrastructure/PostgresEquipmentLoanRepository.js';
import { EquipmentLoanValidator } from './domain/services/EquipmentLoanValidator.js';
import { NewEquipmentLoanUseCase } from './application/NewEquipmentLoanUseCase.js';
import { GetEquipmentLoanUseCase } from './application/GetEquipmentLoanUseCase.js';
import { EquipmentLoanController } from './delivery/EquipmentLoanController.js';
import { UpdateEquipmentLoanUseCase } from './application/UpdateEquipmentLoanUseCase.js';
import { DeleteEquipmentLoanUseCase } from './application/DeleteEquipmentLoanUseCase.js';

import { PostgresSportRepository } from './infrastructure/PostgresSportRepository.js';
import { SportValidator } from './domain/services/SportValidator.js';
import { GetSportsUseCase } from './application/GetSportsUseCase.js';
import { CreateSportUseCase } from './application/CreateSportUseCase.js';
import { UpdateSportUseCase } from './application/UpdateSportUseCase.js';
import { DeleteSportUseCase } from './application/DeleteSportUseCase.js';
import { SportController } from './delivery/SportController.js';

import { PostgresDisciplineRepository } from './infrastructure/PostgresDisciplineRepository.js';
import { CreateDisciplineUseCase } from './application/CreateDisciplineUseCase.js';
import { GetDisciplinesUseCase } from './application/GetDisciplinesUseCase.js';
import { UpdateDisciplineUseCase } from './application/UpdateDisciplineUseCase.js';
import { DeleteDisciplineUseCase } from './application/DeleteDisciplineUseCase.js';
import { DisciplineController } from './delivery/DisciplineController.js';
import { DisciplineValidator } from './domain/services/DisciplineValidator.js';

import { PostgresPaymentRepository } from './infrastructure/PostgresPaymentRepository.js';
import { PaymentValidator } from './domain/services/PaymentValidator.js';
import { CreatePaymentUseCase } from './application/CreatePaymentUseCase.js';
import { GetPaymentsUseCase } from './application/GetPaymentsUseCase.js';
import { GetPaymentByIdUseCase } from './application/GetPaymentByIdUseCase.js';
import { UpdatePaymentUseCase } from './application/UpdatePaymentUseCase.js';
import { DeletePaymentUseCase } from './application/DeletePaymentUseCase.js';
import { PaymentController } from './delivery/PaymentController.js';

import { PostgresLockerRepository } from './infrastructure/PostgresLockerRepository.js';
import { LockerValidator } from './domain/services/LockerValidator.js';
import { CreateLockerUseCase } from './application/CreateLockerUseCase.js';
import { GetLockersUseCase } from './application/GetLockersUseCase.js';
import { LockerController } from './delivery/LockerController.js';
import { UpdateLockerUseCase } from './application/UpdateLockerUseCase.js';
import { DeleteLockerUseCase } from './application/DeleteLockerUseCase.js';

export function buildApp() {
    const server = Fastify({
        logger: {
            level: 'info',
            transport:
                process.env.NODE_ENV === 'development'
                    ? {
                          target: 'pino-pretty',
                          options: {
                              translateTime: 'HH:MM:ss Z',
                              ignore: 'pid,hostname',
                          },
                      }
                    : undefined,
        },
    });

    server.register(cors, {
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });

    // ==========================================
    // Members
    // ==========================================

    const memberRepo = new PostgresMemberRepository();

    const memberValidator = new MemberValidator(memberRepo);

    const createMemberUseCase = new CreateMemberUseCase(
        memberRepo,
        memberValidator,
    );

    const updateMemberUseCase = new UpdateMemberUseCase(
        memberRepo,
        memberValidator,
    );

    const deleteMemberUseCase = new DeleteMemberUseCase(memberRepo);

    // ==========================================
    // Equipment Loans
    // ==========================================

    const equipmentLoanRepo = new PostgresEquipmentLoanRepository();

    const equipmentLoanValidator = new EquipmentLoanValidator(
        equipmentLoanRepo,
        memberRepo,
    );

    const getEquipmentLoanUseCase = new GetEquipmentLoanUseCase(
        equipmentLoanRepo,
    );

    const newEquipmentLoanUseCase = new NewEquipmentLoanUseCase(
        equipmentLoanRepo,
        equipmentLoanValidator,
    );
    const updateEquipmentLoanUseCase = new UpdateEquipmentLoanUseCase(
        equipmentLoanRepo,
        equipmentLoanValidator,
    );
    const deleteEquipmentLoanUseCase = new DeleteEquipmentLoanUseCase(
        equipmentLoanRepo,
    );

    const getMembersUseCase = new GetMembersUseCase(memberRepo);

    const memberController = new MemberController(
        createMemberUseCase,
        getMembersUseCase,
        updateMemberUseCase,
        deleteMemberUseCase,
    );

    // lockers

    const lockerRepo = new PostgresLockerRepository();

    const lockerValidator = new LockerValidator(lockerRepo);

    const createLockerUseCase = new CreateLockerUseCase(
        lockerRepo,
        lockerValidator,
    );

    const getLockersUseCase = new GetLockersUseCase(lockerRepo);

    const updateLockerUseCase = new UpdateLockerUseCase(
        lockerRepo,
        lockerValidator,
        memberRepo,
    );

    const deleteLockerUseCase = new DeleteLockerUseCase(lockerRepo);

    const lockerController = new LockerController(
        createLockerUseCase,
        getLockersUseCase,
        updateLockerUseCase,
        deleteLockerUseCase,
    );

    // ==========================================
    // Member Routes
    // ==========================================

    const equipmentLoanController = new EquipmentLoanController(
        newEquipmentLoanUseCase,
        getEquipmentLoanUseCase,
        updateEquipmentLoanUseCase,
        deleteEquipmentLoanUseCase,
    );

    server.get(
        '/api/v1/socios',
        memberController.getAll.bind(memberController),
    );

    server.post(
        '/api/v1/socios',
        memberController.create.bind(memberController),
    );

    server.put(
        '/api/v1/socios/:id',
        memberController.update.bind(memberController),
    );

    server.delete(
        '/api/v1/socios/:id',
        memberController.delete.bind(memberController),
    );

    server.post(
        '/api/v1/prestamos',
        equipmentLoanController.create.bind(equipmentLoanController),
    );
    server.get(
        '/api/v1/prestamos',
        equipmentLoanController.getAll.bind(equipmentLoanController),
    );
    server.put(
        '/api/v1/prestamos/:id',
        equipmentLoanController.update.bind(equipmentLoanController),
    );
    server.delete(
        '/api/v1/prestamos/:id',
        equipmentLoanController.delete.bind(equipmentLoanController),
    );

    // rutas del locker

    server.get(
        '/api/v1/lockers',
        lockerController.getAll.bind(lockerController),
    );

    server.post(
        '/api/v1/lockers',
        lockerController.create.bind(lockerController),
    );

    server.put(
        '/api/v1/lockers/:id',

        lockerController.update.bind(lockerController),
    );

    server.delete(
        '/api/v1/lockers/:id',

        lockerController.delete.bind(lockerController),
    );

    server.get('/test-lockers', async () => {
        return {
            ok: true,
        };
    });

    server.get('/health', async (request, reply) => {
        return reply.status(200).send({ status: 'ok' });
    });

    console.log('LOCKER ROUTES REGISTERED');
    console.log(server.printRoutes());
    // =========================
    // SPORTS
    // =========================

    const sportRepo = new PostgresSportRepository();

    const sportValidator = new SportValidator(sportRepo);

    const getSportsUseCase = new GetSportsUseCase(sportRepo);

    const createSportUseCase = new CreateSportUseCase(
        sportRepo,
        sportValidator,
    );

    const updateSportUseCase = new UpdateSportUseCase(
        sportRepo,
        sportValidator,
    );

    const deleteSportUseCase = new DeleteSportUseCase(sportRepo);

    const sportController = new SportController(
        getSportsUseCase,
        createSportUseCase,
        updateSportUseCase,
        deleteSportUseCase,
    );

    server.get('/api/v1/sports', sportController.getAll.bind(sportController));

    server.post('/api/v1/sports', sportController.create.bind(sportController));

    server.put(
        '/api/v1/sports/:id',
        sportController.update.bind(sportController),
    );

    server.delete(
        '/api/v1/sports/:id',
        sportController.delete.bind(sportController),
    );

    // =========================
    // DISCIPLINES
    // =========================

    const disciplineRepo = new PostgresDisciplineRepository();

    const disciplineValidator = new DisciplineValidator(disciplineRepo);

    const createDisciplineUseCase = new CreateDisciplineUseCase(
        disciplineRepo,
        disciplineValidator,
    );

    const getDisciplinesUseCase = new GetDisciplinesUseCase(disciplineRepo);

    const updateDisciplineUseCase = new UpdateDisciplineUseCase(
        disciplineRepo,
        disciplineValidator,
    );

    const deleteDisciplineUseCase = new DeleteDisciplineUseCase(
        disciplineRepo,
        disciplineValidator,
    );

    const disciplineController = new DisciplineController(
        createDisciplineUseCase,
        getDisciplinesUseCase,
        updateDisciplineUseCase,
        deleteDisciplineUseCase,
    );

    server.get(
        '/api/v1/disciplines',
        disciplineController.getAll.bind(disciplineController),
    );

    server.post(
        '/api/v1/disciplines',
        disciplineController.create.bind(disciplineController),
    );

    server.put(
        '/api/v1/disciplines/:id',
        disciplineController.update.bind(disciplineController),
    );

    server.delete(
        '/api/v1/disciplines/:id',
        disciplineController.delete.bind(disciplineController),
    );

    // =========================
    // PAYMENT
    // =========================

    const paymentRepository = new PostgresPaymentRepository();

    const paymentValidator = new PaymentValidator();

    const getPaymentsUseCase = new GetPaymentsUseCase(paymentRepository);

    const getPaymentByIdUseCase = new GetPaymentByIdUseCase(paymentRepository);

    const createPaymentUseCase = new CreatePaymentUseCase(
        paymentRepository,
        memberRepo,
        paymentValidator,
    );

    const updatePaymentUseCase = new UpdatePaymentUseCase(
        paymentRepository,
        paymentValidator,
    );

    const deletePaymentUseCase = new DeletePaymentUseCase(
        paymentRepository,
        paymentValidator,
    );

    const paymentController = new PaymentController(
        createPaymentUseCase,
        getPaymentsUseCase,
        getPaymentByIdUseCase,
        updatePaymentUseCase,
        deletePaymentUseCase,
    );

    server.post(
        '/api/v1/payments',
        paymentController.create.bind(paymentController),
    );

    server.get(
        '/api/v1/payments',
        paymentController.getAll.bind(paymentController),
    );

    server.get(
        '/api/v1/payments/:id',
        paymentController.getById.bind(paymentController),
    );

    server.put(
        '/api/v1/payments/:id',
        paymentController.update.bind(paymentController),
    );

    server.delete(
        '/api/v1/payments/:id',
        paymentController.delete.bind(paymentController),
    );

    // =========================
    // HEALTHCHECK
    // =========================

    server.get('/', async (_req, rep) => {
        rep.status(200).send({ msg: 'ok' });
    });

    return server;
}

if (process.argv[1] && process.argv[1].endsWith('app.ts')) {
    const server = buildApp();

    const port = parseInt(process.env.PORT || '3000', 10);

    server.listen(
        {
            port,
            host: '0.0.0.0',
        },

        () => server.log.info(`API server running on http://localhost:${port}`),
    );

    ['SIGINT', 'SIGTERM'].forEach((signal) => {
        process.on(signal, async () => {
            await server.close();

            process.exit(0);
        });
    });
}
