import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/auth.models';

@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective {
  private readonly templateRef = inject(TemplateRef<any>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authService = inject(AuthService);

  private roles: UserRole[] = [];
  private hasView = false;

  @Input() set appHasRole(roleOrRoles: UserRole | UserRole[]) {
    this.roles = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
    this.updateView();
  }

  constructor() {
    // Re-evaluate when user changes
    effect(() => {
      this.authService.currentUser();
      this.updateView();
    });
  }

  private updateView(): void {
    const user = this.authService.currentUser();
    let permitted = false;

    if (user) {
      if (user.isPlatformAdmin) {
        permitted = true;
      } else {
        permitted = this.roles.some((role) => this.authService.hasRole(role));
      }
    }

    if (permitted && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!permitted && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
