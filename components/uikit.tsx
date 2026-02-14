import React from 'react';
import { Button as ShadcnButton } from "@/components/ui/button";
import { Card as ShadcnCard, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input as ShadcnInput } from "@/components/ui/input";
import {
    Table as ShadcnTable,
    TableHeader as ShadcnTableHeader,
    TableBody as ShadcnTableBody,
    TableFooter as ShadcnTableFooter,
    TableHead as ShadcnTableHead,
    TableRow as ShadcnTableRow,
    TableCell as ShadcnTableCell,
    TableCaption as ShadcnTableCaption
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {
    NavigationMenu,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuLink,
    navigationMenuTriggerStyle
} from "@/components/ui/navbar";
import {
    Sidebar as ShadcnSidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

// 1. Button Wrapper
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';

export interface ButtonProps {
    label: string;
    onClick?: () => void;
    variant?: ButtonVariant;
    size?: 'default' | 'sm' | 'lg' | 'icon';
    isLoading?: boolean;
}

export const Button = ({ label, onClick, variant = 'primary', size = 'default', isLoading }: ButtonProps) => {
    const mapVariant = (v: ButtonVariant) => {
        switch (v) {
            case 'primary': return 'default';
            case 'danger': return 'destructive';
            default: return v;
        }
    };

    return (
        <ShadcnButton
            variant={mapVariant(variant)}
            size={size}
            onClick={onClick}
            disabled={isLoading}
        >
            {label}
        </ShadcnButton>
    );
};

// 2. Card Wrapper
export interface CardProps {
    title?: string;
    children: React.ReactNode;
}

export const Card = ({ title, children }: CardProps) => (
    <ShadcnCard className="h-full">
        {title && (
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
        )}
        <CardContent className={!title ? "pt-6" : ""}>
            {children}
        </CardContent>
    </ShadcnCard>
);

// 3. Row Wrapper
export interface RowProps {
    children: React.ReactNode;
}

export const Row = ({ children }: RowProps) => (
    <div className="flex gap-4 items-center flex-wrap">
        {children}
    </div>
);

// 4. Input Wrapper
export interface InputProps {
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    type?: string;
}

export const Input = ({ value, onChange, placeholder, type = "text" }: InputProps) => (
    <ShadcnInput
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
    />
);

// 5. Table Wrapper
export interface TableProps {
    data: any[];
    caption?: string;
}

export const Table = ({ data, caption }: TableProps) => {
    if (!data || data.length === 0) return <div className="p-4 text-center text-muted-foreground">No data available</div>;
    const columns = Object.keys(data[0]);
    return (
        <div className="border rounded-md">
            <ShadcnTable>
                {caption && <ShadcnTableCaption>{caption}</ShadcnTableCaption>}
                <ShadcnTableHeader>
                    <ShadcnTableRow>
                        {columns.map(col => <ShadcnTableHead key={col} className="capitalize">{col}</ShadcnTableHead>)}
                    </ShadcnTableRow>
                </ShadcnTableHeader>
                <ShadcnTableBody>
                    {data.map((row, i) => (
                        <ShadcnTableRow key={i}>
                            {columns.map(col => <ShadcnTableCell key={col}>{row[col]}</ShadcnTableCell>)}
                        </ShadcnTableRow>
                    ))}
                </ShadcnTableBody>
            </ShadcnTable>
        </div>
    );
};

// 6. Modal Wrapper
export interface ModalProps {
    triggerLabel: string;
    title: string;
    description?: string;
    children: React.ReactNode;
}

export const Modal = ({ triggerLabel, title, description, children }: ModalProps) => (
    <Dialog>
        <DialogTrigger asChild>
            <Button label={triggerLabel} variant="outline" />
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                {description && <DialogDescription>{description}</DialogDescription>}
            </DialogHeader>
            <div className="mt-4">
                {children}
            </div>
        </DialogContent>
    </Dialog>
);

// 7. Navbar Wrapper — Full page layout with top navigation
export interface NavbarProps {
    items: { title: string; href: string }[];
    children?: React.ReactNode;
}

export const Navbar = ({ items, children }: NavbarProps) => (
    <div className="flex flex-col min-h-screen w-full">
        {/* Top Navbar */}
        <header className="border-b bg-background sticky top-0 z-30">
            <div className="flex items-center justify-between px-6 py-3">
                <div className="font-bold text-lg">App</div>
                <NavigationMenu>
                    <NavigationMenuList>
                        {items.map((item) => (
                            <NavigationMenuItem key={item.title}>
                                <a href={item.href} className={navigationMenuTriggerStyle()}>
                                    {item.title}
                                </a>
                            </NavigationMenuItem>
                        ))}
                    </NavigationMenuList>
                </NavigationMenu>
            </div>
        </header>
        {/* Page Content */}
        {children && (
            <main className="flex-1 p-6">
                {children}
            </main>
        )}
    </div>
);

// 8. Sidebar Wrapper
export interface SidebarProps {
    items: { title: string; url: string; icon?: any }[];
    children: React.ReactNode;
}

export const Sidebar = ({ items, children }: SidebarProps) => (
    <SidebarProvider>
        <div className="flex min-h-screen w-full">
            <ShadcnSidebar>
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>Application</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {items.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild>
                                            <a href={item.url}>
                                                <span>{item.title}</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
            </ShadcnSidebar>
            <main className="flex-1 p-6">
                {children}
            </main>
        </div>
    </SidebarProvider>
);

// 9. Chart Wrapper
export interface ChartProps {
    data: any[];
    config: any;
    xKey: string;
    yKeys: string[];
    type?: 'bar'; // Extendable
}

export const Chart = ({ data, config, xKey, yKeys, type = 'bar' }: ChartProps) => {
    return (
        <ChartContainer config={config} className="min-h-[200px] w-full">
            <BarChart accessibilityLayer data={data}>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey={xKey}
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                {yKeys.map((key, index) => (
                    <Bar key={key} dataKey={key} fill={`var(--color-${key})`} radius={4} />
                ))}
            </BarChart>
        </ChartContainer>
    )
};
