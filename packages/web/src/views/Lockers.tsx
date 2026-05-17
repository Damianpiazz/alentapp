import {
    Table,
    Button,
    Heading,
    HStack,
    Stack,
    Text,
    Box,
    Flex,
    Spinner,
    Center,
    Input,
} from '@chakra-ui/react';

import { LuPlus, LuRefreshCw, LuPencil } from 'react-icons/lu';

import { useEffect, useState } from 'react';

import { lockersService } from '../services/lockers';

import type {
    LockerDTO,
    CreateLockerRequest,
    UpdateLockerRequest,
    LockerLocation,
    LockerStatus,
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

import {
    SelectRoot,
    SelectTrigger,
    SelectValueText,
    SelectContent,
    SelectItem,
    createListCollection,
} from '../components/ui/select';

const locations = createListCollection({
    items: [
        {
            label: 'Vestuario Masculino',
            value: 'Vestuario Masculino',
        },
        {
            label: 'Vestuario Femenino',
            value: 'Vestuario Femenino',
        },
        {
            label: 'Niños',
            value: 'Niños',
        },
    ],
});

const statuses = createListCollection({
    items: [
        {
            label: 'Disponible',
            value: 'Disponible',
        },
        {
            label: 'Ocupado',
            value: 'Ocupado',
        },
        {
            label: 'Mantenimiento',
            value: 'Mantenimiento',
        },
    ],
});

export function LockersView() {
    const [lockers, setLockers] = useState<LockerDTO[]>([]);

    const [isLoading, setIsLoading] = useState(true);

    const [error, setError] = useState<string | null>(null);

    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [editingLocker, setEditingLocker] = useState<LockerDTO | null>(null);

    const [formData, setFormData] = useState<
        CreateLockerRequest & UpdateLockerRequest
    >({
        number: '',
        location: 'Vestuario Masculino',
        status: 'Disponible',
        member_id: null,
        contract_finish_date: null,
        contract_start_date: null,
    });

    const fetchLockers = async () => {
        setIsLoading(true);

        setError(null);

        try {
            const data = await lockersService.getAll();

            setLockers(data);
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Error al cargar lockers';

            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingLocker(null);

        setFormData({
            number: '',
            location: 'Vestuario Masculino',
            status: 'Disponible',
            member_id: null,
            contract_finish_date: null,
            contract_start_date: null,
        });

        setIsDialogOpen(true);
    };

    const openEditModal = (locker: LockerDTO) => {
        setEditingLocker(locker);

        setFormData({
            number: locker.number,
            location: locker.location,
            status: locker.status,
            member_id: locker.member_dni || '',
            contract_start_date: locker.contract_start_date,
            contract_finish_date: locker.contract_finish_date
                ? locker.contract_finish_date
                      .split('T')[0]
                      .split('-')
                      .reverse()
                      .join('/')
                : '',
        });

        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsSubmitting(true);

        try {
            if (editingLocker) {
                await lockersService.update(editingLocker.id, formData);
            } else {
                await lockersService.create(formData);
            }

            setIsDialogOpen(false);

            setEditingLocker(null);

            if (editingLocker) {
                setLockers((prev) =>
                    prev.map((locker) =>
                        locker.id === editingLocker.id
                            ? {
                                  ...locker,
                                  ...formData,
                              }
                            : locker,
                    ),
                );
            } else {
                await fetchLockers();
            }
        } catch (error: unknown) {
            alert((error as Error).message || 'Error al guardar locker');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteLocker = async (id: string) => {
        const confirmed = window.confirm('¿Desea liberar el locker?');

        if (!confirmed) {
            return;
        }

        try {
            await lockersService.delete(id);

            await fetchLockers();
        } catch (error) {
            const err = error as Error;

            alert(err.message);
        }
    };

    useEffect(() => {
        const load = async () => {
            await fetchLockers();
        };

        load();
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
                            Administración de Lockers
                        </Heading>

                        <Text color="fg.muted" fontSize="md">
                            Gestiona los lockers del club.
                        </Text>
                    </Stack>

                    <HStack gap="3">
                        <Button
                            variant="outline"
                            onClick={fetchLockers}
                            disabled={isLoading}
                        >
                            <LuRefreshCw />
                            Actualizar
                        </Button>

                        <Button colorPalette="blue" onClick={openCreateModal}>
                            <LuPlus />
                            Agregar Locker
                        </Button>
                    </HStack>
                </Flex>

                <DialogContent>
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>
                                {editingLocker
                                    ? 'Editar Locker'
                                    : 'Agregar Nuevo Locker'}
                            </DialogTitle>
                        </DialogHeader>

                        <DialogBody>
                            <Stack gap="4">
                                <Field label="Número" required>
                                    <Input
                                        placeholder="Ej. 101"
                                        value={formData.number}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                number: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </Field>

                                <Field label="Ubicación" required>
                                    <SelectRoot
                                        collection={locations}
                                        value={[formData.location]}
                                        onValueChange={(e) => {
                                            setFormData({
                                                ...formData,
                                                location: e
                                                    .value[0] as LockerLocation,
                                            });
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValueText placeholder="Seleccione ubicación" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            {locations.items.map((loc) => (
                                                <SelectItem
                                                    item={loc}
                                                    key={loc.value}
                                                >
                                                    {loc.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </SelectRoot>
                                </Field>

                                <Field label="Estado">
                                    <SelectRoot
                                        collection={statuses}
                                        value={[
                                            formData.status || 'Disponible',
                                        ]}
                                        onValueChange={(e) => {
                                            const nextStatus = e
                                                .value[0] as LockerStatus;

                                            if (nextStatus !== 'Ocupado') {
                                                setFormData({
                                                    ...formData,

                                                    status: nextStatus,

                                                    member_id: null,

                                                    contract_finish_date: null,
                                                });

                                                return;
                                            }

                                            setFormData({
                                                ...formData,

                                                status: nextStatus,
                                            });
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValueText placeholder="Seleccione estado" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            {statuses.items
                                                .filter((status) => {
                                                    if (!editingLocker) {
                                                        return true;
                                                    }

                                                    if (
                                                        editingLocker.status ===
                                                        'Mantenimiento'
                                                    ) {
                                                        return (
                                                            status.value !==
                                                            'Ocupado'
                                                        );
                                                    }

                                                    if (
                                                        editingLocker.status ===
                                                        'Ocupado'
                                                    ) {
                                                        return (
                                                            status.value !==
                                                            'Mantenimiento'
                                                        );
                                                    }

                                                    return true;
                                                })
                                                .map((status) => (
                                                    <SelectItem
                                                        item={status}
                                                        key={status.value}
                                                    >
                                                        {status.label}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </SelectRoot>
                                </Field>

                                {formData.status === 'Ocupado' && (
                                    <>
                                        <Field label="DNI del socio">
                                            <Input
                                                placeholder="Ej. 12345678"
                                                value={formData.member_id || ''}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        member_id:
                                                            e.target.value ||
                                                            null,
                                                    })
                                                }
                                            />
                                        </Field>

                                        <Field label="Fecha Fin Contrato">
                                            <Input
                                                placeholder="dd/mm/aaaa"
                                                value={
                                                    formData.contract_finish_date ||
                                                    ''
                                                }
                                                onChange={(e) => {
                                                    let value =
                                                        e.target.value.replace(
                                                            /\D/g,
                                                            '',
                                                        );

                                                    if (value.length > 2) {
                                                        value =
                                                            value.slice(0, 2) +
                                                            '/' +
                                                            value.slice(2);
                                                    }

                                                    if (value.length > 5) {
                                                        value =
                                                            value.slice(0, 5) +
                                                            '/' +
                                                            value.slice(5, 9);
                                                    }

                                                    setFormData({
                                                        ...formData,
                                                        contract_finish_date:
                                                            value,
                                                    });
                                                }}
                                            />
                                        </Field>
                                    </>
                                )}
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
                                {editingLocker
                                    ? 'Actualizar Locker'
                                    : 'Crear Locker'}
                            </Button>
                        </DialogFooter>

                        <DialogCloseTrigger />
                    </form>
                </DialogContent>

                {error && (
                    <Box p="4" bg="red.50" color="red.700" borderRadius="md">
                        <Text>{error}</Text>
                    </Box>
                )}

                <Box
                    bg="bg.panel"
                    borderRadius="xl"
                    borderWidth="1px"
                    overflow="hidden"
                    minH="300px"
                >
                    {isLoading ? (
                        <Center h="300px">
                            <Spinner />
                        </Center>
                    ) : (
                        <Table.Root>
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeader>
                                        Número
                                    </Table.ColumnHeader>

                                    <Table.ColumnHeader>
                                        Ubicación
                                    </Table.ColumnHeader>

                                    <Table.ColumnHeader>
                                        Estado
                                    </Table.ColumnHeader>

                                    <Table.ColumnHeader>
                                        Vencimiento
                                    </Table.ColumnHeader>

                                    <Table.ColumnHeader>
                                        Acciones
                                    </Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>

                            <Table.Body>
                                {lockers.map((locker) => (
                                    <Table.Row key={locker.id}>
                                        <Table.Cell>{locker.number}</Table.Cell>

                                        <Table.Cell>
                                            {locker.location}
                                        </Table.Cell>

                                        <Table.Cell>{locker.status}</Table.Cell>

                                        <Table.Cell>
                                            {locker.contract_finish_date
                                                ? locker.contract_finish_date
                                                      .split('T')[0]
                                                      .split('-')
                                                      .reverse()
                                                      .join('/')
                                                : '-'}
                                        </Table.Cell>

                                        <Table.Cell>
                                            <Button
                                                size="sm"
                                                ml="2"
                                                variant="outline"
                                                colorPalette="blue"
                                                onClick={() =>
                                                    openEditModal(locker)
                                                }
                                            >
                                                <LuPencil />
                                                Editar
                                            </Button>

                                            {locker.status === 'Ocupado' && (
                                                <Button
                                                    size="sm"
                                                    ml="2"
                                                    variant="outline"
                                                    colorPalette="red"
                                                    onClick={() =>
                                                        handleDeleteLocker(
                                                            locker.id,
                                                        )
                                                    }
                                                >
                                                    Liberar
                                                </Button>
                                            )}
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
