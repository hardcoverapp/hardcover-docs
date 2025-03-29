/**
 * This file is meant to be a single point to export all components from the components folder.
 * This will make it easier for community members to use the components on new pages.
 */

/**
 * shadcn/ui components
 * Most of these components have not been used on the site yet but can be added as needed.
 */
// import { Accordion } from "./ui/accordion";
// import { Alert } from "./ui/alert";
// import { AlertDialog } from "./ui/alert-dialog";
// import { AspectRatio } from "./ui/aspect-ratio";
// import { Avatar } from "./ui/avatar";
// import { Badge } from "./ui/badge";
// import { Breadcrumb } from "./ui/breadcrumb";
import { Button } from "./ui/button";
// import { Calendar } from "./ui/calendar";
import { Card } from "./ui/card";
// import { Carousel } from "./ui/carousel";
// import { Chart } from "./ui/chart";
// import { Checkbox } from "./ui/checkbox";
// import { Collapsible } from "./ui/collapsible";
// import { Command } from "./ui/command";
// import { ContextMenu } from "./ui/context-menu";
// import { DataTable } from "./ui/data-table";
// import { DatePicker } from "./ui/date-picker";
// import { Dialog } from "./ui/dialog";
// import { Drawer } from "./ui/drawer";
// import { DropdownMenu } from "./ui/dropdown-menu";
// import { Form } from "./ui/form";
// import { HoverCard } from "./ui/hover-card";
import { Input } from "./ui/input";
// import { InputOTP } from "./ui/input-otp";
import { Label } from "./ui/label";
// import { MenuBar } from "./ui/menu-bar";
// import { NavigationMenu } from "./ui/navigation-menu";
// import { Pagination } from "./ui/pagination";
// import { Popover } from "./ui/popover";
// import { Progress } from "./ui/progress";
// import { RadioGroup } from "./ui/radio-group";
// import { Resizable } from "./ui/resizable";
import { ScrollArea } from "./ui/scroll-area";
// import { Select } from "./ui/select";
import { Separator } from "./ui/separator";
// import { Sheet } from "./ui/sheet";
// import { Skeleton } from "./ui/skeleton";
// import { Slider } from "./ui/slider";
// import { Sonner } from "./ui/sonner";
// import { Switch } from "./ui/switch";
import { Table } from "./ui/table";
import { Tabs } from "./ui/tabs";
import { Textarea } from "./ui/textarea";
// import { Toast } from "./ui/toast";
// import { Toggle } from "./ui/toggle";
// import { ToggleGroup } from "./ui/toggle-group";
// import { Tooltip } from "./ui/tooltip";

/** API Explorer components */
// import { ChartResults } from "./GraphQLExplorer/ChartResults" /** Internal component to GraphQLRunner, most contributors should not need this */
// import { GraphQLExplorer } from "./GraphQLExplorer/GraphQLExplorer"; /** Currently not a react component but an astro component */
import { GraphQLRunner } from "./GraphQLExplorer/GraphQLRunner";
import { JSONResults } from "./GraphQLExplorer/JSONResults";    /** Internal component to GraphQLRunner, most contributors should not need this */
import { StatusMessages } from "./GraphQLExplorer/StatusMessages"; /** Internal component to GraphQLRunner, most contributors should not need this */
import { TableResults } from "./GraphQLExplorer/TableResults"; /** Internal component to GraphQLRunner, most contributors should not need this */

/**
 * Doc Banner components
 * These are UI banner elements for the API / Librarian Guide sections
 */
import { APIBanner} from "./APIBanner";
import { LibrarianBanners } from "./LibrarianBanners";

export const Components = {
    ui: {
        Button,
        Card,
        Input,
        Label,
        ScrollArea,
        Separator,
        Table,
        Tabs,
        Textarea,
    },
    GraphQL: {
        GraphQLRunner,
        JSONResults,
        StatusMessages,
        TableResults,
    },
    banners: {
        api: APIBanner,
        librarian: LibrarianBanners,
    }
}