import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-chart',
  standalone: true,
  template:
    '<div class="chart-wrap"><canvas #cv></canvas></div>',
  styles: `
    :host { display: block; width: 100%; min-height: 220px; }
    .chart-wrap { position: relative; height: 220px; width: 100%; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminChartComponent implements OnChanges, OnDestroy {
  @ViewChild('cv', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;

  @Input({ required: true }) chartTitle!: string;
  @Input({ required: true }) labels: string[] = [];
  @Input({ required: true }) values: number[] = [];
  @Input() variant: 'line' | 'bar' = 'line';
  @Input() color = '#0d9488';

  private chart?: Chart;

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.canvas?.nativeElement) return;
    if (
      changes['labels'] ||
      changes['values'] ||
      changes['chartTitle'] ||
      changes['variant'] ||
      changes['color']
    ) {
      queueMicrotask(() => this.render());
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private render(): void {
    const el = this.canvas.nativeElement;
    if (!this.labels?.length) {
      this.chart?.destroy();
      this.chart = undefined;
      return;
    }

    this.chart?.destroy();

    const variant = this.variant;
    const color = this.color;

    this.chart = new Chart(el, {
      type: variant,
      data: {
        labels: this.labels,
        datasets: [
          {
            label: this.chartTitle,
            data: this.values,
            borderColor: color,
            backgroundColor: variant === 'bar' ? `${color}99` : `${color}22`,
            fill: variant === 'line',
            tension: 0.25,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
        },
        scales: {
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 0,
              autoSkip: true,
              maxTicksLimit: 12,
            },
          },
          y: {
            beginAtZero: true,
            ticks: { precision: 0 },
          },
        },
      },
    });
  }
}
