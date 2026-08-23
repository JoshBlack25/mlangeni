"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ClipboardList, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "../../../../services/supabaseClient";
import AdminOrderModal from "../../../components/dashboard/admin/orders/AdminOrderModal";

const PAGE_SIZE = 5;

const currency = new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
});

export default function AdminOrdersPage(){
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const currentPage = Number(searchParams.get("page") ?? "1");


    const [checkingAdmin, setCheckingAdmin] = useState(true);
    const [orders, setOrders] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);


    useEffect(()=>{
        async function checkAdmin(){
            const {data: userData} = await supabase.auth.getUser();

            if(!userData.user){
                router.replace("/login");
                return;
            }

            const { data: adminRow } = await supabase.from("admin")
            .select("admin_id")
            .eq("user_id", userData.user.id)
            .maybeSingle();

            if(!adminRow){
                router.replace("/dashboard/customer");
                return;
            }

            setCheckingAdmin(false);
        }
        
        checkAdmin();
    }, [router]);

    const loadOrders = useCallback(async ()=>{
        setLoading(true); 
        setError(null);
        
        const from = (currentPage - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const {data, error: ordersError, count} = await supabase.from("orders").select(
            `
            order_id,
            customer_id,
            status,
            total_price,
            event_date,
            start_time,
            end_time,
            event_location,
            created_at,
            event_type(event_name),
            customer(first_name, last_name, email)
            `,
            { count : "exact"}

        ).order("created_at", { ascending: false }).range(from, to);

        if(ordersError){
            setError(ordersError.message);
        } else {
            setOrders(data ?? []);
            setTotalCount(count ?? 0);
        }
    
        setLoading(false);
    }, [currentPage]);

    useEffect(()=>{
        if(checkingAdmin) return;
        loadOrders();
    }, [checkingAdmin, loadOrders]);

    const totalPages = Math.max(1, Math.ceil(totalCount/ PAGE_SIZE));

    function goToPage(page){
        const params = new URLSearchParams(searchParams);
        params.set("page", String(page));
        router.push(`${pathname}?${params.toString()}`);
    }

 if (checkingAdmin) {
    return <p className="p-8 text-white">Checking access...</p>;
  }

     return (
    <div className="min-h-screen bg-[#0A0A0A] px-4 py-8 text-white md:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-md md:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
            <ClipboardList size={14} />
            All Orders
          </div>
          <h1 className="mt-4 text-3xl font-semibold">Orders</h1>
          <p className="mt-2 text-sm text-[#A0A0A0]">
            {totalCount} total {totalCount === 1 ? "order" : "orders"}
          </p>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 sm:p-6">
          {loading ? (
            <div className="flex h-56 items-center justify-center text-[#A0A0A0]">
              Loading orders...
            </div>
          ) : error ? (
            <div className="flex h-56 items-center justify-center text-red-400">
              {error}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex h-56 items-center justify-center text-[#A0A0A0]">
              No orders found.
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <button
                  key={order.order_id}
                  onClick={() => setSelectedOrder(order)}
                  className="w-full rounded-2xl border border-white/10 bg-[#0A0A0A]/70 p-4 text-left transition hover:border-[#D4AF37]/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.25em] text-[#797676]">
                        Order #{order.order_id}
                      </p>
                      <p className="mt-1 font-semibold">
                        {order.customer?.first_name} {order.customer?.last_name} —{" "}
                        {order.event_type?.event_name ?? "Event"}
                      </p>
                      <p className="mt-1 text-sm text-[#A0A0A0]">
                        {order.event_date} · {order.event_location}
                      </p>
                    </div>
                    <p className="font-semibold text-[#D4AF37]">
                      {currency.format(Number(order.total_price || 0))}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* pagination controls */}
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-sm disabled:opacity-30"
            >
              <ChevronLeft size={16} /> Prev
            </button>

            <p className="text-sm text-[#A0A0A0]">
              Page {currentPage} of {totalPages}
            </p>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-sm disabled:opacity-30"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {selectedOrder && (
        <AdminOrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onConsultCreated={() => {
            setSelectedOrder(null);
            loadOrders();
          }}
        />
      )}
    </div>
  );
}