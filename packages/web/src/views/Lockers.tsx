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
} from '@chakra-ui/react';

import { Input } from '@chakra-ui/react';

import { LuPlus, LuRefreshCw } from 'react-icons/lu';

import { useEffect, useState } from 'react';

import { lockersService } from '../services/lockers';

import type {
    LockerDTO,
    CreateLockerRequest,
    LockerLocation,
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

export function LockersView() {
    const [lockers, setLockers] = useState<LockerDTO[]>([]);

    const [isLoading, setIsLoading] = useState(true);

    const [error, setError] = useState<string | null>(null);

    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState<CreateLockerRequest>({
        number: '',

        location: 'Vestuario Masculino',
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
        setFormData({
            number: '',

            location: 'Vestuario Masculino',
        });

        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsSubmitting(true);

        try {
            await lockersService.create(formData);

            setIsDialogOpen(false);

            fetchLockers();
        } catch (error: unknown) {
            alert((error as Error).message || 'Error al crear locker');
        } finally {
            setIsSubmitting(false);
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
                            <DialogTitle>Agregar Nuevo Locker</DialogTitle>
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
                                        onValueChange={(e) =>
                                            setFormData({
                                                ...formData,

                                                location: e
                                                    .value[0] as LockerLocation,
                                            })
                                        }
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
                                Crear Locker
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
