import { Box, SimpleGrid, Heading, Text, VStack } from '@chakra-ui/react';
import {
    LuUsers,
    LuTrophy,
    LuShield,
    LuBox,
    LuDollarSign,
    LuVolleyball,
} from 'react-icons/lu';
import { SectionCard } from '../components/SectionCard';

export function HomeView() {
    return (
        <Box>
            <VStack gap="6" align="flex-start" mb="12">
                <Heading
                    size="4xl"
                    fontWeight="extrabold"
                    letterSpacing="tight"
                    bgGradient="to-r"
                    gradientFrom="blue.600"
                    gradientTo="cyan.400"
                    bgClip="text"
                >
                    Bienvenido a Alentapp
                </Heading>
                <Text fontSize="xl" color="fg.muted" maxW="2xl">
                    El panel de administración central para gestionar todos los
                    aspectos de tu club. Selecciona una sección a continuación
                    para comenzar.
                </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="8">
                <SectionCard
                    title="Miembros"
                    description="Administra el padrón de socios, sus categorías, estados de cuenta y datos personales."
                    to="/members"
                    icon={LuUsers}
                />
                <SectionCard
                    title="Lockers"
                    description="Administra los lockers y casilleros disponibles del club."
                    to="/lockers"
                    icon={LuBox}
                />

                <SectionCard
                    title="Préstamos"
                    description="Gestiona los préstamos de equipos, sus plazos y estados de devolución."
                    to="/loans"
                    icon={LuVolleyball}
                />

                <SectionCard
                    title="Deportes"
                    description="Registra nuevas disciplinas deportivas con sus cupos, precios y requisitos médicos."
                    to="/sports"
                    icon={LuTrophy}
                />

                <SectionCard
                    title="Disciplina"
                    description="Registra y gestiona las sanciones disciplinarias de los socios del club."
                    to="/disciplines"
                    icon={LuShield}
                />

                <SectionCard
                    title="Pagos"
                    description="Gestiona las cuotas y obligaciones financieras de los socios."
                    to="/payments"
                    icon={LuDollarSign}
                />
            </SimpleGrid>
        </Box>
    );
}
