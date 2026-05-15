import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SportValidator } from './SportValidator.js';
import { SportRepository } from '../SportRepository.js';
describe('SportValidator', () => {
    const mockSportRepo = {
        findByName: vi.fn(),
    } as unknown as SportRepository;
    const validator = new SportValidator(mockSportRepo);
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe('validateName', () => {
        it('debe pasar correctamente si el nombre es válido', () => {
            expect(() => validator.validateName('Fútbol')).not.toThrow();
            expect(() => validator.validateName('Natación')).not.toThrow();
        });
        it('debe lanzar error si el nombre está vacío', () => {
            expect(() => validator.validateName('')).toThrow(
                'El nombre del deporte es inválido',
            );
        });
        it('debe lanzar error si el nombre contiene solo espacios', () => {
            expect(() => validator.validateName('   ')).toThrow(
                'El nombre del deporte es inválido',
            );
        });
        it('debe lanzar error si el nombre tiene menos de 3 caracteres', () => {
            expect(() => validator.validateName('A')).toThrow(
                'El nombre del deporte debe tener al menos 3 caracteres',
            );
            expect(() => validator.validateName('Ab')).toThrow(
                'El nombre del deporte debe tener al menos 3 caracteres',
            );
        });
        it('debe lanzar error si el nombre excede el máximo permitido', () => {
            const longName = 'a'.repeat(101);
            expect(() => validator.validateName(longName)).toThrow(
                'El nombre excede el máximo permitido',
            );
        });
    });
    describe('validateDescription', () => {
        it('debe pasar correctamente si la descripción es válida', () => {
            expect(() =>
                validator.validateDescription('Entrenamiento competitivo'),
            ).not.toThrow();
        });
        it('debe lanzar error si la descripción está vacía', () => {
            expect(() => validator.validateDescription('')).toThrow(
                'La descripción es obligatoria',
            );
        });
        it('debe lanzar error si la descripción contiene solo espacios', () => {
            expect(() => validator.validateDescription('   ')).toThrow(
                'La descripción es obligatoria',
            );
        });
        it('debe lanzar error si la descripción excede el máximo permitido', () => {
            const longDescription = 'a'.repeat(501);
            expect(() =>
                validator.validateDescription(longDescription),
            ).toThrow('La descripción excede el máximo permitido');
        });
    });
    describe('validateMaxCapacity', () => {
        it('debe pasar si la capacidad máxima es válida', () => {
            expect(() => validator.validateMaxCapacity(10)).not.toThrow();
            expect(() => validator.validateMaxCapacity(100)).not.toThrow();
        });
        it('debe lanzar error si la capacidad máxima es menor o igual a cero', () => {
            expect(() => validator.validateMaxCapacity(0)).toThrow(
                'La capacidad máxima debe ser mayor a cero',
            );
            expect(() => validator.validateMaxCapacity(-5)).toThrow(
                'La capacidad máxima debe ser mayor a cero',
            );
        });
        it('debe lanzar error si la capacidad máxima no es numérica', () => {
            expect(() => validator.validateMaxCapacity('abc' as any)).toThrow(
                'La capacidad máxima debe ser numérica',
            );
            expect(() => validator.validateMaxCapacity(NaN)).toThrow(
                'La capacidad máxima debe ser numérica',
            );
        });
    });
    describe('validateAdditionalPrice', () => {
        it('debe pasar si el precio adicional es válido', () => {
            expect(() => validator.validateAdditionalPrice(0)).not.toThrow();
            expect(() => validator.validateAdditionalPrice(1500)).not.toThrow();
        });
        it('debe lanzar error si el precio adicional es negativo', () => {
            expect(() => validator.validateAdditionalPrice(-1)).toThrow(
                'El precio adicional no puede ser negativo',
            );
        });
        it('debe lanzar error si el precio adicional no es numérico', () => {
            expect(() =>
                validator.validateAdditionalPrice('abc' as any),
            ).toThrow('El precio adicional debe ser numérico');
            expect(() => validator.validateAdditionalPrice(NaN)).toThrow(
                'El precio adicional debe ser numérico',
            );
        });
    });
    describe('validateNameIsUnique', () => {
        it('debe pasar si el nombre no existe en la base de datos', async () => {
            vi.mocked(mockSportRepo.findByName).mockResolvedValueOnce(null);
            await expect(
                validator.validateNameIsUnique('Fútbol'),
            ).resolves.not.toThrow();
            expect(mockSportRepo.findByName).toHaveBeenCalledWith('Fútbol');
        });
        it('debe pasar si el nombre existe pero pertenece al mismo deporte', async () => {
            vi.mocked(mockSportRepo.findByName).mockResolvedValueOnce({
                id: 'sport-1',
                name: 'Fútbol',
            } as any);
            await expect(
                validator.validateNameIsUnique('Fútbol', 'sport-1'),
            ).resolves.not.toThrow();
        });
        it('debe lanzar error si el nombre existe y pertenece a otro deporte', async () => {
            vi.mocked(mockSportRepo.findByName).mockResolvedValueOnce({
                id: 'sport-2',
                name: 'Fútbol',
            } as any);
            await expect(
                validator.validateNameIsUnique('Fútbol', 'sport-1'),
            ).rejects.toThrow('Ya existe un deporte con ese nombre');
        });
    });
    describe('normalizeName', () => {
        it('debe eliminar espacios al inicio y final', () => {
            expect(validator.normalizeName('  Fútbol  ')).toBe('Fútbol');
        });
    });
    describe('normalizeDescription', () => {
        it('debe eliminar espacios al inicio y final', () => {
            expect(
                validator.normalizeDescription('  Entrenamiento competitivo  '),
            ).toBe('Entrenamiento competitivo');
        });
    });
});
