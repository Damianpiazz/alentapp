import {
    Table,
    Button,
    Heading,
    HStack,
    IconButton,
    Stack,
    Text,
    Box,
    Flex,
    Spinner,
    Center,
    Input,
} from '@chakra-ui/react';
import { LuPlus, LuPencil, LuTrash2, LuRefreshCw } from 'react-icons/lu';
import { useEffect, useState } from 'react';
import { disciplinesService } from '../services/disciplines';
import { membersService } from '../services/members';
import type {
    DisciplineDTO,
    CreateDisciplineRequest,
    UpdateDisciplineRequest,
    MemberDTO,
} from '@alentapp/shared';
import {
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
    DialogActionTrigger,
    DialogCloseTrigger,
} from '../components/ui/dialog';
import { Field } from '../components/ui/field';

export function DisciplinesView() {
    const [disciplines, setDisciplines] = useState<DisciplineDTO[]>([]);
    const [members, setMembers] = useState<MemberDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingDisciplineId, setEditingDisciplineId] = useState<
        string | null
    >(null);

    const [formData, setFormData] = useState<CreateDisciplineRequest>({
        member_id: '',
        reason: '',
        start_date: '',
        end_date: '',
        is_total_suspension: false,
    });

    const fetchDisciplines = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await disciplinesService.getAll();
            setDisciplines(data);
        } catch (err: unknown) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'Error al cargar las sanciones';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMembers = async () => {
        try {
            const data = await membersService.getAll();
            setMembers(data);
        } catch (err: unknown) {
            console.error('Error al cargar socios', err);
        }
    };

    const openCreateModal = () => {
        setEditingDisciplineId(null);
        setFormData({
            member_id: '',
            reason: '',
            start_date: '',
            end_date: '',
            is_total_suspension: false,
        });
        setIsDialogOpen(true);
    };

    const openEditModal = (discipline: DisciplineDTO) => {
        setEditingDisciplineId(discipline.id);
        setFormData({
            member_id: discipline.member_id,
            reason: discipline.reason,
            start_date: discipline.start_date,
            end_date: discipline.end_date,
            is_total_suspension: discipline.is_total_suspension,
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingDisciplineId) {
                await disciplinesService.update(
                    editingDisciplineId,
                    formData as UpdateDisciplineRequest,
                );
            } else {
                await disciplinesService.create(
                    formData as CreateDisciplineRequest,
                );
            }
            setIsDialogOpen(false);
            await fetchDisciplines();
        } catch (err: unknown) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'Error al guardar la sanción';
            alert(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, reason: string) => {
        if (
            window.confirm(
                `¿Estás seguro de que deseas eliminar la sanción "${reason}"? Esta acción no se puede deshacer.`,
            )
        ) {
            try {
                await disciplinesService.delete(id);
                await fetchDisciplines();
            } catch (err: unknown) {
                const message =
                    err instanceof Error
                        ? err.message
                        : 'Error al eliminar la sanción';
                alert(message);
            }
        }
    };

    const getMemberName = (memberId: string) => {
        const member = members.find((m) => m.id === memberId);
        return member ? member.name : memberId;
    };

    useEffect(() => {
        const loadData = async () => {
            await fetchDisciplines();
            await fetchMembers();
        };
        loadData();
    }, []);

    return (
        <DialogRoot
            open={isDialogOpen}
            onOpenChange={(e) => setIsDialogOpen(e.open)}
        >
            <Stack gap="8">
                <Flex justify="space-between" align="center">
                    <Stack gap="1">
                        <Heading size="2xl" fontWeight="bold">
                            Tribunal de Disciplina
                        </Heading>
                        <Text color="fg.muted" fontSize="md">
                            Gestiona las sanciones disciplinarias de los socios
                            del club.
                        </Text>
                    </Stack>
                    <HStack gap="3">
                        <Button
                            variant="outline"
                            onClick={fetchDisciplines}
                            disabled={isLoading}
                        >
                            <LuRefreshCw /> Actualizar
                        </Button>
                        <Button
                            colorPalette="blue"
                            size="md"
                            onClick={openCreateModal}
                        >
                            <LuPlus /> Nueva Sanción
                        </Button>
                    </HStack>
                </Flex>

                <DialogContent>
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>
                                {editingDisciplineId
                                    ? 'Editar Sanción'
                                    : 'Nueva Sanción Disciplinaria'}
                            </DialogTitle>
                        </DialogHeader>
                        <DialogBody>
                            <Stack gap="4">
                                <Field label="Socio" required>
                                    <select
                                        value={formData.member_id}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                member_id: e.target.value,
                                            })
                                        }
                                        required
                                        disabled={!!editingDisciplineId}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            borderRadius: '6px',
                                            border: '1px solid #ccc',
                                        }}
                                    >
                                        <option value="">
                                            Seleccione un socio
                                        </option>
                                        {members.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.name} - {m.dni}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label="Motivo" required>
                                    <Input
                                        placeholder="Describe el motivo de la sanción"
                                        value={formData.reason}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                reason: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </Field>
                                <Field label="Fecha de inicio" required>
                                    <Input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                start_date: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </Field>
                                <Field label="Fecha de fin" required>
                                    <Input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                end_date: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </Field>
                                <Field label="Suspensión total">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_total_suspension}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                is_total_suspension:
                                                    e.target.checked,
                                            })
                                        }
                                    />
                                </Field>
                            </Stack>
                        </DialogBody>
                        <DialogFooter>
                            <DialogActionTrigger asChild>
                                <Button variant="outline">Cancelar</Button>
                            </DialogActionTrigger>
                            <Button
                                type="submit"
                                colorPalette="blue"
                                loading={isSubmitting}
                            >
                                {editingDisciplineId
                                    ? 'Guardar Cambios'
                                    : 'Crear Sanción'}
                            </Button>
                        </DialogFooter>
                        <DialogCloseTrigger />
                    </form>
                </DialogContent>

                {error && (
                    <Box
                        p="4"
                        bg="red.50"
                        color="red.700"
                        borderRadius="md"
                        border="1px solid"
                        borderColor="red.200"
                    >
                        <Text fontWeight="bold">Error:</Text>
                        <Text>{error}</Text>
                    </Box>
                )}

                <Box
                    bg="bg.panel"
                    borderRadius="xl"
                    boxShadow="sm"
                    borderWidth="1px"
                    overflow="hidden"
                    minH="300px"
                    position="relative"
                >
                    {isLoading ? (
                        <Center h="300px">
                            <Stack align="center" gap="4">
                                <Spinner size="xl" color="blue.500" />
                                <Text color="fg.muted">
                                    Cargando sanciones...
                                </Text>
                            </Stack>
                        </Center>
                    ) : disciplines.length === 0 ? (
                        <Center h="300px">
                            <Stack align="center" gap="4">
                                <Text color="fg.muted">
                                    No se encontraron sanciones.
                                </Text>
                                <Button
                                    variant="ghost"
                                    onClick={fetchDisciplines}
                                >
                                    Reintentar
                                </Button>
                            </Stack>
                        </Center>
                    ) : (
                        <Table.Root size="md" variant="line" interactive>
                            <Table.Header>
                                <Table.Row bg="bg.muted/50">
                                    <Table.ColumnHeader py="4">
                                        Socio
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader py="4">
                                        Motivo
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader py="4">
                                        Fecha Inicio
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader py="4">
                                        Fecha Fin
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader py="4">
                                        Suspensión Total
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader py="4" textAlign="end">
                                        Acciones
                                    </Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {disciplines.map((discipline) => (
                                    <Table.Row
                                        key={discipline.id}
                                        _hover={{ bg: 'bg.muted/30' }}
                                    >
                                        <Table.Cell
                                            fontWeight="semibold"
                                            color="fg.emphasized"
                                        >
                                            {getMemberName(
                                                discipline.member_id,
                                            )}
                                        </Table.Cell>
                                        <Table.Cell color="fg.muted">
                                            {discipline.reason}
                                        </Table.Cell>
                                        <Table.Cell color="fg.muted">
                                            {discipline.start_date}
                                        </Table.Cell>
                                        <Table.Cell color="fg.muted">
                                            {discipline.end_date}
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Box
                                                display="inline-block"
                                                px="2"
                                                py="0.5"
                                                borderRadius="md"
                                                bg={
                                                    discipline.is_total_suspension
                                                        ? 'red.50'
                                                        : 'green.50'
                                                }
                                                color={
                                                    discipline.is_total_suspension
                                                        ? 'red.700'
                                                        : 'green.700'
                                                }
                                                fontSize="xs"
                                                fontWeight="bold"
                                            >
                                                {discipline.is_total_suspension
                                                    ? 'Sí'
                                                    : 'No'}
                                            </Box>
                                        </Table.Cell>
                                        <Table.Cell textAlign="end">
                                            <HStack gap="2" justify="flex-end">
                                                <IconButton
                                                    variant="ghost"
                                                    size="sm"
                                                    aria-label="Editar sanción"
                                                    onClick={() =>
                                                        openEditModal(
                                                            discipline,
                                                        )
                                                    }
                                                >
                                                    <LuPencil />
                                                </IconButton>
                                                <IconButton
                                                    variant="ghost"
                                                    size="sm"
                                                    colorPalette="red"
                                                    aria-label="Eliminar sanción"
                                                    onClick={() =>
                                                        handleDelete(
                                                            discipline.id,
                                                            discipline.reason,
                                                        )
                                                    }
                                                >
                                                    <LuTrash2 />
                                                </IconButton>
                                            </HStack>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    )}
                </Box>
            </Stack>
        </DialogRoot>
    );
}
