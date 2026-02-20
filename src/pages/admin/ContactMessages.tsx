import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    getAdminContactMessages,
    updateContactMessageStatus,
    deleteContactMessage,
    ContactMessage
} from "@/lib/api";
import {
    Mail,
    MessageSquare,
    Trash2,
    Eye,
    CheckCircle2,
    Clock,
    RefreshCw,
    Search,
    Filter,
    User,
    Phone
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const ContactMessages = () => {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    useEffect(() => {
        loadMessages();
    }, []);

    const loadMessages = async () => {
        try {
            setLoading(true);
            const data = await getAdminContactMessages();
            setMessages(data);
        } catch (error) {
            toast.error("Erreur lors du chargement des messages.");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: 'read' | 'replied') => {
        try {
            await updateContactMessageStatus(id, newStatus);
            setMessages(messages.map(m => m.id === id ? { ...m, status: newStatus } : m));
            if (selectedMessage?.id === id) {
                setSelectedMessage({ ...selectedMessage, status: newStatus });
            }
            toast.success("Statut mis à jour.");
        } catch (error) {
            toast.error("Erreur lors de la mise à jour.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer ce message ?")) return;
        try {
            await deleteContactMessage(id);
            setMessages(messages.filter(m => m.id !== id));
            toast.success("Message supprimé.");
        } catch (error) {
            toast.error("Erreur lors de la suppression.");
        }
    };

    const filteredMessages = messages.filter(msg => {
        const matchesSearch =
            msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            msg.subject?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" || msg.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'new':
                return <Badge className="bg-blue-500 hover:bg-blue-600">Nouveau</Badge>;
            case 'read':
                return <Badge variant="secondary" className="bg-gray-500 text-white">Lu</Badge>;
            case 'replied':
                return <Badge className="bg-green-500 hover:bg-green-600">Répondu</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Mail className="h-8 w-8 text-primary" />
                        Messages de Contact
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gérez les demandes et messages de vos clients.
                    </p>
                </div>
                <Button onClick={loadMessages} variant="outline" size="sm" className="gap-2">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Actualiser
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher un message..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-11"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="all">Tous les statuts</option>
                        <option value="new">Nouveaux</option>
                        <option value="read">Lus</option>
                        <option value="replied">Répondus</option>
                    </select>
                </div>
            </div>

            <Card className="border-primary/10 shadow-lg">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead>Date</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Sujet</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-60" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredMessages.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                        Aucun message trouvé.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredMessages.map((msg) => (
                                    <TableRow key={msg.id} className="group hover:bg-muted/30 transition-colors">
                                        <TableCell className="text-sm font-medium">
                                            {format(new Date(msg.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold">{msg.name}</span>
                                                <span className="text-xs text-muted-foreground">{msg.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate font-medium">
                                            {msg.subject}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(msg.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setSelectedMessage(msg);
                                                        if (msg.status === 'new') handleStatusUpdate(msg.id, 'read');
                                                    }}
                                                    className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(msg.id)}
                                                    className="text-destructive hover:text-destructive hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Message Detail Dialog */}
            <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-2xl">
                            <MessageSquare className="h-6 w-6 text-primary" />
                            Détail du message
                        </DialogTitle>
                        <DialogDescription>
                            Envoyé le {selectedMessage && format(new Date(selectedMessage.created_at), 'PPPP à HH:mm', { locale: fr })}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedMessage && (
                        <div className="space-y-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-3 rounded-lg bg-muted flex items-center gap-3">
                                    <User className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Nom</p>
                                        <p className="font-bold">{selectedMessage.name}</p>
                                    </div>
                                </div>
                                <div className="p-3 rounded-lg bg-muted flex items-center gap-3">
                                    <Mail className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Email</p>
                                        <p className="font-bold">{selectedMessage.email}</p>
                                    </div>
                                </div>
                                {selectedMessage.phone && (
                                    <div className="p-3 rounded-lg bg-muted flex items-center gap-3">
                                        <Phone className="h-5 w-5 text-primary" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Téléphone</p>
                                            <p className="font-bold">{selectedMessage.phone}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="p-3 rounded-lg bg-muted flex items-center gap-3">
                                    <Clock className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Statut actuel</p>
                                        <div className="mt-1">{getStatusBadge(selectedMessage.status)}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-bold text-lg border-b pb-1">Sujet : {selectedMessage.subject}</h4>
                                <div className="p-4 rounded-xl bg-primary/5 min-h-[150px] italic leading-relaxed text-lg">
                                    "{selectedMessage.message}"
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t">
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => handleStatusUpdate(selectedMessage.id, 'read')}
                                        disabled={selectedMessage.status === 'read'}
                                        className="gap-2"
                                    >
                                        Marquer comme lu
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleStatusUpdate(selectedMessage.id, 'replied')}
                                        disabled={selectedMessage.status === 'replied'}
                                        className="gap-2 bg-green-500/10 text-green-700 hover:bg-green-500 hover:text-white"
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        Marquer comme répondu
                                    </Button>
                                </div>
                                <Button
                                    onClick={() => {
                                        window.location.href = `mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`;
                                    }}
                                    className="gap-2"
                                >
                                    <Mail className="h-4 w-4" />
                                    Répondre par email
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ContactMessages;
