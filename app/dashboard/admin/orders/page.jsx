"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "../../../../services/supabaseClient";
import AdminOrderModal from "../../../components/dashboard/admin/orders/AdminOrderModal";
import {
    Button,
    DataTable,
    EmptyState,
    PageHeader,
    Panel,
    SkeletonRows,
    StatusBadge,
    formatCurrency,
    formatDate,
  Blank,
} from "@/app/components/dashboard/ui";

const PAGE_SIZE = 5;

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

    const columns = [
        {
            key: "order",
            header: "Order",
            primary: true,
            render: (order) => (
                <span className="flex min-w-0 flex-col">
                    <span className="font-medium text-mgh-text">
                        {order.event_type?.event_name ?? "Event"}
                    </span>
                    <span className="text-caption tabular-nums text-mgh-dim">
                        ORD-{String(order.order_id).slice(0, 8).toUpperCase()}
                    </span>
                </span>
            ),
        },
        {
            key: "event_date",
            header: "Event date",
            render: (order) => (
                <span className="tabular-nums text-mgh-muted">{formatDate(order.event_date)}</span>
            ),
        },
        {
            key: "customer",
            header: "Customer",
            render: (order) => {
                const name = [order.customer?.first_name, order.customer?.last_name]
                    .filter(Boolean)
                    .join(" ");
                return <span className="text-mgh-muted">{name || <Blank />}</span>;
            },
        },
        {
            key: "status",
            header: "Status",
            render: (order) => <StatusBadge status={order.status} />,
        },
        {
            key: "total",
            header: "Total",
            align: "right",
            render: (order) => formatCurrency(order.total_price || 0),
        },
    ];

  if (checkingAdmin) {
    return (
      <div role="status" className="text-sm text-mgh-muted">
        Checking access...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        density="dense"
        title="Orders"
        lead={`${totalCount} total ${totalCount === 1 ? "order" : "orders"}`}
      />

      <Panel density="dense">
        {loading ? (
          <SkeletonRows rows={PAGE_SIZE} label="Loading orders..." />
        ) : error ? (
          <p role="alert" className="py-10 text-center text-sm text-mgh-danger">
            {error}
          </p>
        ) : (
          <DataTable
            density="dense"
            caption="Orders"
            columns={columns}
            rows={orders}
            getRowKey={(order) => order.order_id}
            onRowClick={(order) => setSelectedOrder(order)}
            empty={<EmptyState title="No orders found." />}
          />
        )}

        {/* pagination controls */}
        <nav
          aria-label="Orders pagination"
          className="mt-4 flex items-center justify-between gap-3"
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft size={16} aria-hidden="true" /> Prev
          </Button>

          <p className="text-caption tabular-nums text-mgh-dim">
            Page {currentPage} of {totalPages}
          </p>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Next <ChevronRight size={16} aria-hidden="true" />
          </Button>
        </nav>
      </Panel>

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
