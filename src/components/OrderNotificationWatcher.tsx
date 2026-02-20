import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllOrders } from '@/lib/api';
import { toast } from 'sonner';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const OrderNotificationWatcher = () => {
    const { user } = useAuth();
    const n = useNavigate();
    const lastOrderIdRef = useRef<string | null>(null);
    const isFirstRun = useRef(true);

    useEffect(() => {
        // Ne surveiller que pour les admins
        if (!user || user.role !== 'admin') return;

        const checkNewOrders = async () => {
            try {
                const { orders } = await getAllOrders({ limit: 1 });
                if (orders && orders.length > 0) {
                    const latestOrder = orders[0];

                    if (isFirstRun.current) {
                        lastOrderIdRef.current = latestOrder.id;
                        isFirstRun.current = false;
                        return;
                    }

                    if (latestOrder.id !== lastOrderIdRef.current) {
                        lastOrderIdRef.current = latestOrder.id;

                        // Notification sonore (optionnel, mais sympa)
                        try {
                            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                            audio.play();
                        } catch (e) {
                            console.log("Audio play blocked by browser");
                        }

                        toast.success("Nouvelle commande !", {
                            description: `Une nouvelle commande #${latestOrder.id.slice(0, 8)} de ${latestOrder.shippingAddress?.name || 'Client'} vient d'arriver d'arriver.`,
                            icon: <Bell className="h-4 w-4 text-green-500" />,
                            duration: 10000,
                            action: {
                                label: "Voir",
                                onClick: () => n('/admin/orders')
                            }
                        });
                    }
                }
            } catch (error) {
                console.error("Error checking for new orders:", error);
            }
        };

        // Vérifier toutes les 30 secondes
        const interval = setInterval(checkNewOrders, 30000);

        // Premier check après un court délai
        const timeout = setTimeout(checkNewOrders, 5000);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [user]);

    return null;
};
