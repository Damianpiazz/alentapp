import {
    Table,
    Button,
    Heading,
    HStack,
    Stack,
    Text,
    Box,
    Flex,
    Input,
    Spinner,
    Center,
} from '@chakra-ui/react';
import { LuPlus, LuRefreshCw } from 'react-icons/lu';
import { useEffect, useState, useMemo } from 'react';
import { paymentsService } from '../services/payments';
import { membersService } from '../services/members';
import type {
    CreatePaymentRequest,
    MemberDTO,
    PaymentDTO,
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

const monthsCollection = createListCollection({
    items: Array.from({ length: 12 }, (_, i) => ({
        label: `Mes ${i + 1}`,
        value: String(i + 1),
    })),
});

export function PaymentsView() {
    const [payments, setPayments] = useState<PaymentDTO[]>([]);
    const [members, setMembers] = useState<MemberDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Modal state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState<CreatePaymentRequest>({
        amount: 0,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        due_date: '',
        member_id: '',
    });

    const membersCollection = useMemo(
        () =>
            createListCollection({
                items: members.map((m) => ({
                    label: `${m.name} (${m.dni})`,
                    value: m.id,
                })),
            }),
        [members],
    );

    // trae los miembros para llenar el select
    const fetchMembers = async () => {
        try {
            const membersData = await membersService.getAll();
            setMembers(membersData);
        } catch {
            setError('Error al cargar los socios para el formulario.');
        }
    };

    const fetchPayments = async () => {
        setIsLoading(true);
        try {
            const data = await paymentsService.getAll();
            setPayments(data);
        } catch {
            setError('Error al cargar los pagos');
        } finally {
            setIsLoading(false);
        }
    };

    const openCreateModal = () => {
        setSuccessMsg(null);
        setError(null);
        setFormData({
            amount: 0,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            due_date: '',
            member_id: '',
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        try {
            await paymentsService.create(formData);
            setIsDialogOpen(false);
            setSuccessMsg('Pago registrado correctamente');
        } catch (error) {
            const err = error as Error;
            setError(err.message || 'Error al generar el pago');
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchPayments();
        fetchMembers();
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
                            Administración de Pagos
                        </Heading>
                        <Text color="fg.muted" fontSize="md">
                            Gestiona las cuotas y obligaciones financieras de
                            los socios.
                        </Text>
                    </Stack>
                    <HStack gap="3">
                        <Button
                            variant="outline"
                            onClick={fetchPayments}
                            disabled={isLoading}
                        >
                            <LuRefreshCw /> Actualizar
                        </Button>
                        <Button
                            colorPalette="blue"
                            size="md"
                            onClick={openCreateModal}
                        >
                            <LuPlus /> Generar Pago
                        </Button>
                    </HStack>
                </Flex>

                <DialogContent>
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>Generar Nuevo Pago</DialogTitle>
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
                                                member_id: e.value[0],
                                            })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValueText placeholder="Seleccione un socio" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {membersCollection.items.map(
                                                (m) => (
                                                    <SelectItem
                                                        item={m}
                                                        key={m.value}
                                                    >
                                                        {m.label}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </SelectRoot>
                                </Field>

                                <Field label="Monto" required>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="Ej. 1500.50"
                                        value={formData.amount || ''}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                amount: parseFloat(
                                                    e.target.value,
                                                ),
                                            })
                                        }
                                        required
                                    />
                                </Field>

                                <HStack gap="4">
                                    <Field label="Mes" required>
                                        <SelectRoot
                                            collection={monthsCollection}
                                            value={[String(formData.month)]}
                                            onValueChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    month: parseInt(
                                                        e.value[0],
                                                        10,
                                                    ),
                                                })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValueText placeholder="Mes" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {monthsCollection.items.map(
                                                    (m) => (
                                                        <SelectItem
                                                            item={m}
                                                            key={m.value}
                                                        >
                                                            {m.label}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </SelectRoot>
                                    </Field>

                                    <Field label="Año" required>
                                        <Input
                                            type="number"
                                            placeholder="Ej. 2026"
                                            value={formData.year}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    year: parseInt(
                                                        e.target.value,
                                                        10,
                                                    ),
                                                })
                                            }
                                            required
                                        />
                                    </Field>
                                </HStack>

                                <Field label="Fecha de Vencimiento" required>
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
                                Generar Pago
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

                {successMsg && (
                    <Box
                        p="4"
                        bg="green.50"
                        color="green.700"
                        borderRadius="md"
                        border="1px solid"
                        borderColor="green.200"
                    >
                        <Text>{successMsg}</Text>
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
                                <Text color="fg.muted">Cargando pagos...</Text>
                            </Stack>
                        </Center>
                    ) : payments.length === 0 ? (
                        <Center h="300px">
                            <Stack align="center" gap="4">
                                <Text color="fg.muted">
                                    No se encontraron pagos.
                                </Text>
                                <Button variant="ghost" onClick={fetchPayments}>
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
                                        Monto
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader py="4">
                                        Período
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader py="4">
                                        Vencimiento
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader py="4">
                                        Estado
                                    </Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {payments.map((payment) => {
                                    // Buscamos el socio para mostrar su nombre en lugar del UUID
                                    const member = members.find(
                                        (m) => m.id === payment.member_id,
                                    );
                                    const memberName = member
                                        ? `${member.name}`
                                        : 'Socio Eliminado/Desconocido';

                                    // Lógica de colores para los estados
                                    let statusColor = 'gray';
                                    if (payment.status === 'Paid')
                                        statusColor = 'green';
                                    else if (payment.status === 'Pending')
                                        statusColor = 'blue';
                                    else if (payment.status === 'Overdue')
                                        statusColor = 'red';
                                    else if (payment.status === 'Canceled')
                                        statusColor = 'orange';

                                    return (
                                        <Table.Row
                                            key={payment.id}
                                            _hover={{ bg: 'bg.muted/30' }}
                                        >
                                            <Table.Cell
                                                fontWeight="semibold"
                                                color="fg.emphasized"
                                            >
                                                {memberName}
                                            </Table.Cell>
                                            <Table.Cell color="fg.muted">
                                                ${payment.amount}
                                            </Table.Cell>
                                            <Table.Cell color="fg.muted">
                                                {payment.month}/{payment.year}
                                            </Table.Cell>
                                            <Table.Cell color="fg.muted">
                                                {payment.due_date
                                                    ? new Date(
                                                          payment.due_date,
                                                      ).toLocaleDateString()
                                                    : '-'}
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Box
                                                    display="inline-block"
                                                    px="2"
                                                    py="0.5"
                                                    borderRadius="md"
                                                    bg={`${statusColor}.50`}
                                                    color={`${statusColor}.700`}
                                                    fontSize="xs"
                                                    fontWeight="bold"
                                                >
                                                    {payment.status}
                                                </Box>
                                            </Table.Cell>
                                        </Table.Row>
                                    );
                                })}
                            </Table.Body>
                        </Table.Root>
                    )}
                </Box>
            </Stack>
        </DialogRoot>
    );
}
