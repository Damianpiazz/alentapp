import {
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
import { LuPlus, LuRefreshCw } from 'react-icons/lu';
import { useEffect, useMemo, useState } from 'react';
import { equipmentLoanService } from '../services/equipmentLoan';
import { membersService } from '../services/members';
import type {
    CreateEquipmentLoanRequest,
    EquipmentLoanDTO,
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
import {
    SelectRoot,
    SelectTrigger,
    SelectValueText,
    SelectContent,
    SelectItem,
    createListCollection,
} from '../components/ui/select';

export function LoansView() {
    const [loans, setLoans] = useState<EquipmentLoanDTO[]>([]);
    const [members, setMembers] = useState<MemberDTO[]>([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        item_name: '',
        due_date: '',
        member_id: '',
    });

    const membersCollection = useMemo(
        () =>
            createListCollection({
                items: members.map((member) => ({
                    label: `${member.name} (${member.dni})`,
                    value: member.id,
                })),
            }),
        [members],
    );

    const fetchLoans = async () => {
        try {
            const data = await equipmentLoanService.getAll();
            setLoans(data);
        } catch (err: unknown) {
            setFetchError(
                (err as Error).message || 'Error al cargar los préstamos',
            );
        }
    };

    const fetchMembers = async () => {
        setIsLoadingMembers(true);
        setFetchError(null);
        try {
            const data = await membersService.getAll();
            setMembers(
                data.filter(
                    (member) =>
                        member.status !== 'Suspendido' &&
                        member.category !== 'Cadete',
                ),
            );
        } catch (err: unknown) {
            setFetchError(
                (err as Error).message || 'Error al cargar los socios',
            );
        } finally {
            setIsLoadingMembers(false);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            await fetchMembers();
        };
        loadData();
    }, []);

    useEffect(() => {
        const loadLoans = async () => {
            await fetchLoans();
        };
        loadLoans();
    }, []);

    const openCreateModal = async () => {
        setError(null);
        setSuccess(null);
        setFormData({ item_name: '', due_date: '', member_id: '' });
        await fetchMembers();
        setIsDialogOpen(true);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);
        setIsSubmitting(true);

        if (!formData.item_name.trim()) {
            setError('El nombre del ítem es obligatorio');
            setIsSubmitting(false);
            return;
        }

        if (!formData.due_date) {
            setError('La fecha de devolución es obligatoria');
            setIsSubmitting(false);
            return;
        }

        if (!formData.member_id) {
            setError('Debes seleccionar un socio');
            setIsSubmitting(false);
            return;
        }

        try {
            const payload: CreateEquipmentLoanRequest = {
                item_name: formData.item_name,
                due_date: new Date(formData.due_date),
                member_id: formData.member_id,
            };

            await equipmentLoanService.create(payload);
            setSuccess('Préstamo creado correctamente');
            setIsDialogOpen(false);
        } catch (err: unknown) {
            setError((err as Error).message || 'Error al crear el préstamo');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DialogRoot
            open={isDialogOpen}
            onOpenChange={(open) => setIsDialogOpen(open.open)}
        >
            <Stack gap="8">
                <Flex justify="space-between" align="center">
                    <Stack gap="1">
                        <Heading size="2xl" fontWeight="bold">
                            Alta de Préstamos
                        </Heading>
                        <Text color="fg.muted" fontSize="md">
                            Crea un nuevo préstamo de equipamiento para socios
                            activos y no cadetes.
                        </Text>
                    </Stack>
                    <HStack gap="3">
                        <Button
                            variant="outline"
                            onClick={fetchMembers}
                            disabled={isLoadingMembers}
                        >
                            <LuRefreshCw /> Recargar Socios
                        </Button>
                        <Button
                            colorPalette="blue"
                            size="md"
                            onClick={openCreateModal}
                        >
                            <LuPlus /> Nuevo Préstamo
                        </Button>
                    </HStack>
                </Flex>

                {fetchError && (
                    <Box
                        p="4"
                        bg="red.50"
                        color="red.700"
                        borderRadius="md"
                        border="1px solid"
                        borderColor="red.200"
                    >
                        <Text fontWeight="bold">Error:</Text>
                        <Text>{fetchError}</Text>
                    </Box>
                )}

                {success && (
                    <Box
                        p="4"
                        bg="green.50"
                        color="green.700"
                        borderRadius="md"
                        border="1px solid"
                        borderColor="green.200"
                    >
                        <Text fontWeight="bold">Éxito</Text>
                        <Text>{success}</Text>
                    </Box>
                )}

                <DialogContent>
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>Registrar nuevo préstamo</DialogTitle>
                        </DialogHeader>
                        <DialogBody>
                            <Stack gap="4">
                                <Field label="Socio" required>
                                    <SelectRoot
                                        collection={membersCollection}
                                        value={
                                            formData.member_id
                                                ? [formData.member_id]
                                                : []
                                        }
                                        onValueChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                member_id: e.value[0] ?? '',
                                            })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValueText placeholder="Selecciona un socio" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {membersCollection.items.map(
                                                (member) => (
                                                    <SelectItem
                                                        item={member}
                                                        key={member.value}
                                                    >
                                                        {member.label}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </SelectRoot>
                                </Field>

                                <Field label="Nombre del ítem" required>
                                    <Input
                                        value={formData.item_name}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                item_name: e.target.value,
                                            })
                                        }
                                        placeholder="Ej. Pelota de fútbol"
                                        required
                                    />
                                </Field>

                                <Field label="Fecha de devolución" required>
                                    <Input
                                        type="date"
                                        value={formData.due_date}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                due_date: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </Field>

                                <Text color="fg.muted" fontSize="sm">
                                    Selecciona un socio y completa los datos
                                    para crear un préstamo.
                                </Text>
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
                                Crear Préstamo
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
                    minH="220px"
                    position="relative"
                >
                    {isLoadingMembers ? (
                        <Center h="220px">
                            <Stack align="center" gap="4">
                                <Spinner size="xl" color="blue.500" />
                                <Text color="fg.muted">Cargando socios...</Text>
                            </Stack>
                        </Center>
                    ) : (
                        <Box p="6">
                            {loans.length === 0 ? (
                                <Text color="fg.muted" textAlign="center">
                                    No hay préstamos registrados.
                                </Text>
                            ) : (
                                <Box p="6">
                                    {loans.length === 0 ? (
                                        <Text
                                            color="fg.muted"
                                            textAlign="center"
                                        >
                                            No hay préstamos registrados.
                                        </Text>
                                    ) : (
                                        <Stack gap="4">
                                            {loans.map((loan) => {
                                                // Buscamos el socio correspondiente a este préstamo
                                                const member = members.find(
                                                    (m) =>
                                                        m.id === loan.member_id,
                                                );

                                                return (
                                                    <Box
                                                        key={loan.id}
                                                        p="4"
                                                        borderWidth="1px"
                                                        borderRadius="lg"
                                                        bg="bg.surface"
                                                        _hover={{
                                                            shadow: 'md',
                                                        }}
                                                    >
                                                        <Flex
                                                            justify="space-between"
                                                            align="center"
                                                        >
                                                            <Stack gap="1">
                                                                <Text
                                                                    fontWeight="bold"
                                                                    fontSize="lg"
                                                                >
                                                                    {
                                                                        loan.item_name
                                                                    }
                                                                </Text>
                                                                <Text
                                                                    fontSize="sm"
                                                                    color="fg.muted"
                                                                >
                                                                    {/* Si encontramos al socio, mostramos su nombre y DNI. Si no, mostramos el ID por defecto */}
                                                                    Socio:{' '}
                                                                    {member
                                                                        ? `${member.name} (DNI: ${member.dni})`
                                                                        : `ID: ${loan.member_id}`}
                                                                </Text>
                                                            </Stack>
                                                            <Stack
                                                                align="flex-end"
                                                                gap="1"
                                                            >
                                                                <Text
                                                                    fontSize="xs"
                                                                    fontWeight="medium"
                                                                >
                                                                    Pedido:{' '}
                                                                    {new Date(
                                                                        loan.loan_date,
                                                                    ).toLocaleDateString()}
                                                                </Text>
                                                                <Text
                                                                    fontSize="xs"
                                                                    color="red.600"
                                                                    fontWeight="bold"
                                                                >
                                                                    Devolución:{' '}
                                                                    {new Date(
                                                                        loan.due_date,
                                                                    ).toLocaleDateString()}
                                                                </Text>
                                                                <Box
                                                                    px="2"
                                                                    py="0.5"
                                                                    bg={
                                                                        loan.status ===
                                                                        'Loaned'
                                                                            ? 'green.100'
                                                                            : 'blue.100'
                                                                    }
                                                                    color={
                                                                        loan.status ===
                                                                        'Loaned'
                                                                            ? 'green.800'
                                                                            : 'blue.800'
                                                                    }
                                                                    borderRadius="full"
                                                                    fontSize="xs"
                                                                    fontWeight="bold"
                                                                >
                                                                    {
                                                                        loan.status
                                                                    }
                                                                </Box>
                                                            </Stack>
                                                        </Flex>
                                                    </Box>
                                                );
                                            })}
                                        </Stack>
                                    )}
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>
            </Stack>
        </DialogRoot>
    );
}
