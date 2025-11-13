"use client";

import { getOrderPubic } from "@/lib/api";
import { Order } from "@/types";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const OrderDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchOrder = async () => {
      try {
        const data = await getOrderPubic(id);
        setOrder(data);
      } catch (error) {
        console.error("Erreur chargement commande :", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center h-screen text-red-600 font-semibold">
        Commande introuvable
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Détails de la commande
        </h1>
        <span
          className={`mt-2 sm:mt-0 px-3 py-1 rounded-full text-sm font-medium ${
            order.status === "pending"
              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
              : order.status === "delivered"
              ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
          }`}
        >
          {order.status.toUpperCase()}
        </span>
      </div>

      {/* Informations client et adresse */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm">
          <h2 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">
            Informations du client
          </h2>
          <p>
            <span className="font-medium">Nom :</span> {order.shippingAddress.name}
          </p>
          <p>
            <span className="font-medium">Téléphone :</span> {order.shippingAddress.phone}
          </p>
          
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm">
          <h2 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">
            Adresse de livraison
          </h2>
          <p>{order.shippingAddress.address}</p>
          <p>{order.shippingAddress.city}</p>
        </div>
      </div>

      {/* Liste des articles */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                Produit
              </th>
              <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                Quantité
              </th>
              <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                Prix
              </th>
              <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {order.items.map((item) => (
              <tr key={item.id} className="bg-white dark:bg-gray-900">
                <td className="p-3 flex items-center gap-2">
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="h-12 w-12 object-cover rounded"
                  />
                  <span className="text-gray-800 dark:text-gray-100">{item.productName}</span>
                </td>
                <td className="p-3 text-gray-800 dark:text-gray-100">{item.quantity}</td>
                <td className="p-3 text-gray-800 dark:text-gray-100">{item.price.toFixed(2)} Fcfa</td>
                <td className="p-3 text-gray-800 dark:text-gray-100">
                  {(item.price * item.quantity).toFixed(2)} Fcfa
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total et points de fidélité */}
      <div className="mt-6 flex flex-col sm:flex-row justify-between items-center bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Total : {order.finalTotal.toFixed(2)} Fcfa
        </span>
        <span className="text-gray-700 dark:text-gray-200">
          Points de fidélité gagnés : {order.loyaltyPointsEarned}
        </span>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
