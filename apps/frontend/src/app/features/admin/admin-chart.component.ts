// import {
//   Component,
//   ElementRef,
//   Input,
//   OnChanges,
//   OnDestroy,
//   SimpleChanges,
//   ViewChild,
//   ChangeDetectionStrategy,
// } from '@angular/core';
// import { Chart, registerables } from 'chart.js';

// Chart.register(...registerables);

// @Component({
//   selector: 'app-admin-chart',
//   standalone: true,
//   template:
//     '<div class="chart-wrap"><canvas #cv></canvas></div>',
//   styles: `
//     :host { display: block; width: 100%; min-height: 220px; }
//     .chart-wrap { position: relative; height: 220px; width: 100%; }
//   `,
//   changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class AdminChartComponent implements OnChanges, OnDestroy {
//   @ViewChild('cv', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;

//   @Input({ required: true }) chartTitle!: string;
//   @Input({ required: true }) labels: string[] = [];
//   @Input({ required: true }) values: number[] = [];
//   @Input() variant: 'line' | 'bar' = 'line';
//   @Input() color = '#0d9488';

//   private chart?: Chart;

//   ngOnChanges(changes: SimpleChanges): void {
//     if (!this.canvas?.nativeElement) return;
//     if (
//       changes['labels'] ||
//       changes['values'] ||
//       changes['chartTitle'] ||
//       changes['variant'] ||
//       changes['color']
//     ) {
//       queueMicrotask(() => this.render());
//     }
//   }

//   ngOnDestroy(): void {
//     this.chart?.destroy();
//   }

//   private render(): void {
//     const el = this.canvas.nativeElement;
//     if (!this.labels?.length) {
//       this.chart?.destroy();
//       this.chart = undefined;
//       return;
//     }

//     this.chart?.destroy();

//     const variant = this.variant;
//     const color = this.color;

//     this.chart = new Chart(el, {
//       type: variant,
//       data: {
//         labels: this.labels,
//         datasets: [
//           {
//             label: this.chartTitle,
//             data: this.values,
//             borderColor: color,
//             backgroundColor: variant === 'bar' ? `${color}99` : `${color}22`,
//             fill: variant === 'line',
//             tension: 0.25,
//           },
//         ],
//       },
//       options: {
//         responsive: true,
//         maintainAspectRatio: false,
//         plugins: {
//           legend: {
//             display: true,
//             position: 'top',
//           },
//         },
//         scales: {
//           x: {
//             ticks: {
//               maxRotation: 45,
//               minRotation: 0,
//               autoSkip: true,
//               maxTicksLimit: 12,
//             },
//           },
//           y: {
//             beginAtZero: true,
//             ticks: { precision: 0 },
//           },
//         },
//       },
//     });
//   }
// }


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
  template: `<div class="chart-wrap"><canvas #cv></canvas></div>`,
  styles: [`
    :host { display: block; width: 100%; }
    .chart-wrap { position: relative; height: 220px; width: 100%; }
  `],
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
    const color   = this.color;

    // Detect dark mode
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const gridColor    = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)';
    const tickColor    = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(15,23,42,0.40)';
    const tooltipBg    = isDark ? 'rgba(15,23,42,0.95)'   : 'rgba(255,255,255,0.97)';
    const tooltipTitle = isDark ? '#f8fafc'                : '#0f172a';
    const tooltipBody  = isDark ? 'rgba(248,250,252,0.65)' : 'rgba(15,23,42,0.60)';
    const tooltipBorder= isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.10)';

    this.chart = new Chart(el, {
      type: variant,
      data: {
        labels: this.labels,
        datasets: [
          {
            label: this.chartTitle,
            data: this.values,
            borderColor: color,
            backgroundColor:
              variant === 'bar'
                ? `${color}88`
                : (ctx: any) => {
                    const gradient = ctx.chart.ctx.createLinearGradient(
                      0, 0, 0, ctx.chart.height,
                    );
                    gradient.addColorStop(0, `${color}33`);
                    gradient.addColorStop(1, `${color}00`);
                    return gradient;
                  },
            fill: variant === 'line',
            tension: 0.4,
            borderWidth: variant === 'line' ? 2 : 0,
            borderRadius: variant === 'bar' ? 4 : 0,
            pointRadius: variant === 'line' ? 0 : undefined,
            pointHoverRadius: variant === 'line' ? 4 : undefined,
            pointBackgroundColor: color,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: tooltipBg,
            titleColor: tooltipTitle,
            bodyColor: tooltipBody,
            borderColor: tooltipBorder,
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            boxPadding: 4,
            callbacks: {
              title: (items) => items[0]?.label ?? '',
              label: (item) => ` ${item.dataset.label}: ${item.parsed.y}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: {
              color: tickColor,
              font: { size: 11, family: "'Inter', system-ui, sans-serif" },
              maxRotation: 0,
              maxTicksLimit: 10,
              autoSkip: true,
            },
          },
          y: {
            grid: { color: gridColor },
            border: { display: false, dash: [4, 4] },
            ticks: {
              color: tickColor,
              font: { size: 11, family: "'Inter', system-ui, sans-serif" },
              precision: 0,
              maxTicksLimit: 5,
            },
            beginAtZero: true,
          },
        },
      },
    });
  }
}