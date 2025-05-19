/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { SelectionModel } from '@angular/cdk/collections';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { arraysEqual, groupBySingle, SimplePoliticalBusiness } from 'ausmittlung-lib';
import { ResultExportConfiguration, PoliticalBusinessExportMetadata } from 'ausmittlung-lib';
import { ExportProvider } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/export_pb';

@Component({
  selector: 'app-export-cockpit-political-businesses',
  templateUrl: './export-cockpit-political-businesses.component.html',
  standalone: false,
})
export class ExportCockpitPoliticalBusinessesComponent implements OnChanges {
  private readonly allColumns = ['select', 'politicalBusinessNumber', 'shortDescription', 'doiType', 'politicalBusinessType', 'token'];
  public columns: string[] = [];

  @Input()
  public politicalBusinesses: SimplePoliticalBusiness[] = [];

  @Input()
  public exportConfig!: ResultExportConfiguration;

  @Output()
  public exportConfigChange: EventEmitter<void> = new EventEmitter<void>();

  @Output()
  public isValidChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  public readonly selection = new SelectionModel<SimplePoliticalBusiness>(true, []);
  public isAllSelected: boolean = false;
  private politicalBusinessesById: Record<string, SimplePoliticalBusiness> = {};
  private isValid: boolean = false;

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.politicalBusinesses) {
      this.politicalBusinessesById = groupBySingle(
        this.politicalBusinesses,
        x => x.id,
        x => x,
      );
    }

    if (changes.exportConfig) {
      const columns = [...this.allColumns];
      if (this.exportConfig.provider !== ExportProvider.EXPORT_PROVIDER_SEANTIS) {
        columns.splice(columns.length - 1, 1);
      }
      this.columns = columns;
    }

    if (
      arraysEqual(
        this.exportConfig.politicalBusinessIdsList,
        this.selection.selected.map(({ id }) => id),
      )
    ) {
      return;
    }

    const selectedPoliticalBusinesses = this.exportConfig.politicalBusinessIdsList.map(x => this.politicalBusinessesById[x]);
    this.selection.clear();
    this.selection.select(...selectedPoliticalBusinesses);
    this.updateIsValid();
  }

  public toggleAllRows(value: boolean) {
    if (value === this.isAllSelected) {
      return;
    }

    value ? this.selection.select(...this.politicalBusinesses) : this.selection.clear();
    this.updateSelectedIds();
    this.updateIsAllSelected();
  }

  public getToken(pbId: string): string {
    const metadata = this.exportConfig.politicalBusinessMetadata.get(pbId);
    return metadata?.token ?? '';
  }

  public setToken(pbId: string, token: string): void {
    const metadata = this.exportConfig.politicalBusinessMetadata.get(pbId) ?? ({} as PoliticalBusinessExportMetadata);
    metadata.token = token;
    this.exportConfig.politicalBusinessMetadata.set(pbId, metadata);
    this.exportConfigChange.emit();
    this.updateIsValid();
  }

  public toggleRowWithValue(row: SimplePoliticalBusiness, value: boolean): void {
    if (value === this.selection.isSelected(row)) {
      return;
    }

    this.selection.toggle(row);
    this.updateSelectedIds();
    this.updateIsAllSelected();
  }

  private updateSelectedIds(): void {
    this.exportConfig.politicalBusinessIdsList = this.selection.selected.map(x => x.id);
    this.exportConfigChange.emit();
    this.updateIsValid();
  }

  private updateIsAllSelected(): void {
    const numSelected = this.selection.selected.length;
    const numRows = this.politicalBusinesses.length;
    this.isAllSelected = numSelected === numRows;
  }

  private updateIsValid(): void {
    let valid = true;

    // In case of Seantis, all selected political businesses need a token
    if (this.exportConfig.provider === ExportProvider.EXPORT_PROVIDER_SEANTIS) {
      for (const pbId of this.exportConfig.politicalBusinessIdsList) {
        const metadata = this.exportConfig.politicalBusinessMetadata.get(pbId);
        if (!metadata || !metadata.token) {
          valid = false;
          break;
        }
      }
    }

    if (valid !== this.isValid) {
      this.isValid = valid;
      this.isValidChange.emit(valid);
    }
  }
}
