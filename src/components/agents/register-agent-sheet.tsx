import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function RegisterAgentSheet({ children }: { children: React.ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Enregistrer un nouvel agent</SheetTitle>
          <SheetDescription>
            Ajoutez un nouvel agent à la brigade. Remplissez les détails ci-dessous.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-6 py-6">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nom
            </Label>
            <Input id="name" placeholder="Alex Johnson" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="alex.j@e-brigade.com"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="skills" className="text-right">
              Compétences
            </Label>
            <Input
              id="skills"
              placeholder="Combat, Piratage,..."
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="availability" className="text-right">
              Disponibilité
            </Label>
            <Select>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Sélectionnez le statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Disponible">Disponible</SelectItem>
                <SelectItem value="En mission">En mission</SelectItem>
                <SelectItem value="En congé">En congé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="avatar" className="text-right">
              URL de l'avatar
            </Label>
            <Input id="avatar" type="url" className="col-span-3" />
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit">Sauvegarder l'agent</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
