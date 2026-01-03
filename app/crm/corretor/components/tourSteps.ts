export type TourStep = {
  id: string;
  title: string;
  description: string;
  selector: string;
};

export const tourSteps: TourStep[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Visão geral do seu negócio",
    selector: "#dashboard",
  },
  {
    id: "clientes",
    title: "Clientes",
    description: "Gerencie seus clientes",
    selector: "#clientes",
  },
  {
    id: "imoveis",
    title: "Imóveis",
    description: "Cadastre e gerencie imóveis",
    selector: "#imoveis",
  },
  {
    id: "leads",
    title: "Leads",
    description: "Acompanhe seus leads",
    selector: "#leads",
  },
  {
    id: "config",
    title: "Configurações",
    description: "Personalize seu perfil",
    selector: "#config",
  },
];
