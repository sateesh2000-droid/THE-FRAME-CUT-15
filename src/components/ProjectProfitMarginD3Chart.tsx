import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Project, Expense } from '../types';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  DollarSign, 
  Info, 
  Filter, 
  Layers, 
  Sparkles,
  Search,
  ArrowUpRight,
  HelpCircle,
  Maximize2
} from 'lucide-react';

interface ProjectProfitMarginD3ChartProps {
  projects: Project[];
  expenses?: Expense[];
}

export interface ProjectFinancialData {
  id: string;
  projectName: string;
  coupleName: string;
  studioName: string;
  eventType: string;
  status: string;
  revenue: number;
  editorExpense: number;
  otherExpense: number;
  totalExpenses: number;
  netProfit: number;
  profitMarginPct: number;
}

export const ProjectProfitMarginD3Chart: React.FC<ProjectProfitMarginD3ChartProps> = ({
  projects,
  expenses = []
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [viewType, setViewType] = useState<'treemap' | 'grouped_bar' | 'margin_rank'>('treemap');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [hoveredProject, setHoveredProject] = useState<ProjectFinancialData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Process financial metrics per project
  const projectDataList: ProjectFinancialData[] = useMemo(() => {
    return projects.map(p => {
      const revenue = Number(p.projectAmount) || 0;
      
      // Editor expense calculation (account for split projects)
      let editorExp = Number(p.editorPayment) || 0;
      if (p.isSplitProject) {
        editorExp = (Number(p.firstEditorShare) || 0) + (Number(p.secondEditorShare) || 0);
      }

      // Project explicit other expenses
      const projectOther = Number(p.otherExpenses) || 0;

      // Linked manual expenses matching this project ID
      const linkedExpenses = expenses
        .filter(e => e.projectId === p.id)
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      const totalExpenses = editorExp + projectOther + linkedExpenses;
      const netProfit = revenue - totalExpenses;
      const profitMarginPct = revenue > 0 ? Math.round((netProfit / revenue) * 100) : 0;

      return {
        id: p.id,
        projectName: p.projectName || `${p.coupleName} Wedding`,
        coupleName: p.coupleName || 'Wedding Couple',
        studioName: p.studioName || 'Direct Studio',
        eventType: p.eventType || 'Full Wedding',
        status: p.status,
        revenue,
        editorExpense: editorExp,
        otherExpense: projectOther + linkedExpenses,
        totalExpenses,
        netProfit,
        profitMarginPct
      };
    });
  }, [projects, expenses]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return projectDataList.filter(p => {
      // Status filter
      if (statusFilter === 'active' && ['delivered', 'closed'].includes(p.status)) return false;
      if (statusFilter === 'completed' && !['delivered', 'closed'].includes(p.status)) return false;

      // Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        return p.coupleName.toLowerCase().includes(query) ||
               p.projectName.toLowerCase().includes(query) ||
               p.studioName.toLowerCase().includes(query);
      }
      return true;
    });
  }, [projectDataList, statusFilter, searchTerm]);

  // Overall Portfolio Totals for header summary
  const summary = useMemo(() => {
    const totalRevenue = filteredData.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalExpenses = filteredData.reduce((acc, curr) => acc + curr.totalExpenses, 0);
    const totalProfit = totalRevenue - totalExpenses;
    const avgMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;
    return { totalRevenue, totalExpenses, totalProfit, avgMargin, count: filteredData.length };
  }, [filteredData]);

  // Render D3 chart whenever viewType, filteredData, or container size changes
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = 400;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear canvas

    svg.attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);

    if (filteredData.length === 0) {
      // Empty state
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#64748b')
        .attr('font-size', '14px')
        .attr('font-family', 'sans-serif')
        .text('No matching project data available for visualization');
      return;
    }

    // Color scale for profit margin
    const getMarginColor = (marginPct: number) => {
      if (marginPct >= 65) return '#10b981'; // Emerald
      if (marginPct >= 45) return '#84cc16'; // Lime
      if (marginPct >= 25) return '#eab308'; // Amber
      if (marginPct >= 0)  return '#f97316'; // Orange
      return '#ef4444'; // Red (Negative)
    };

    // ================= 1. D3 TREEMAP VIEW =================
    if (viewType === 'treemap') {
      const margin = { top: 10, right: 10, bottom: 10, left: 10 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

      // Construct D3 hierarchy
      interface HierarchyDatum {
        name: string;
        children?: ProjectFinancialData[];
        value?: number;
      }

      const rootData: HierarchyDatum = {
        name: 'Wedding Projects',
        children: filteredData
      };

      const root = d3.hierarchy<HierarchyDatum>(rootData)
        .sum((d: any) => d.revenue || 1) // Area proportional to revenue
        .sort((a, b) => (b.value || 0) - (a.value || 0));

      const treemapLayout = d3.treemap<HierarchyDatum>()
        .size([innerWidth, innerHeight])
        .paddingOuter(4)
        .paddingInner(4)
        .round(true);

      treemapLayout(root);

      const leaves = root.leaves();

      const nodes = g.selectAll('g')
        .data(leaves)
        .enter()
        .append('g')
        .attr('transform', (d: any) => `translate(${d.x0},${d.y0})`);

      // Draw Rectangles with gradient styling
      nodes.append('rect')
        .attr('width', (d: any) => Math.max(0, d.x1 - d.x0))
        .attr('height', (d: any) => Math.max(0, d.y1 - d.y0))
        .attr('rx', 8)
        .attr('ry', 8)
        .attr('fill', (d: any) => {
          const item = d.data as ProjectFinancialData;
          return getMarginColor(item.profitMarginPct);
        })
        .attr('fill-opacity', 0.85)
        .attr('stroke', '#070c09')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .style('transition', 'all 0.2s ease')
        .on('mouseover', function (event, d: any) {
          d3.select(this)
            .attr('fill-opacity', 1)
            .attr('stroke', '#eab308')
            .attr('stroke-width', 3);
          
          setHoveredProject(d.data as ProjectFinancialData);
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setTooltipPos({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top
            });
          }
        })
        .on('mousemove', function (event) {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setTooltipPos({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top
            });
          }
        })
        .on('mouseout', function () {
          d3.select(this)
            .attr('fill-opacity', 0.85)
            .attr('stroke', '#070c09')
            .attr('stroke-width', 2);
          setHoveredProject(null);
          setTooltipPos(null);
        });

      // Add Text Labels inside treemap boxes if box is large enough
      nodes.each(function (d: any) {
        const item = d.data as ProjectFinancialData;
        const boxWidth = d.x1 - d.x0;
        const boxHeight = d.y1 - d.y0;

        const nodeG = d3.select(this);

        if (boxWidth > 55 && boxHeight > 40) {
          // Couple Name / Title
          nodeG.append('text')
            .attr('x', 8)
            .attr('y', 18)
            .attr('fill', '#ffffff')
            .attr('font-size', boxWidth > 110 ? '12px' : '10px')
            .attr('font-weight', 'bold')
            .attr('font-family', 'sans-serif')
            .attr('pointer-events', 'none')
            .text(() => {
              const name = item.coupleName;
              return name.length > Math.floor(boxWidth / 8) ? name.slice(0, Math.floor(boxWidth / 8)) + '…' : name;
            });

          // Revenue Text
          if (boxHeight > 55) {
            nodeG.append('text')
              .attr('x', 8)
              .attr('y', 34)
              .attr('fill', 'rgba(255,255,255,0.85)')
              .attr('font-size', '10px')
              .attr('font-family', 'monospace')
              .attr('pointer-events', 'none')
              .text(`₹${(item.revenue / 1000).toFixed(0)}k Rev`);
          }

          // Margin Badge
          if (boxHeight > 75 && boxWidth > 75) {
            nodeG.append('text')
              .attr('x', 8)
              .attr('y', 52)
              .attr('fill', '#ffffff')
              .attr('font-size', '11px')
              .attr('font-weight', '800')
              .attr('font-family', 'sans-serif')
              .attr('pointer-events', 'none')
              .text(`${item.profitMarginPct}% Margin`);
          }
        }
      });

    // ================= 2. D3 GROUPED BAR CHART VIEW =================
    } else if (viewType === 'grouped_bar') {
      const margin = { top: 30, right: 30, bottom: 65, left: 65 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

      // Limit max projects displayed in bar chart for readability
      const dataSlice = filteredData.slice(0, 10);

      // X0 Scale (Project Names)
      const x0Scale = d3.scaleBand()
        .domain(dataSlice.map(d => d.coupleName))
        .range([0, innerWidth])
        .paddingInner(0.25);

      // X1 Scale (Sub-bars: Revenue vs Expenses)
      const x1Scale = d3.scaleBand()
        .domain(['revenue', 'totalExpenses'])
        .range([0, x0Scale.bandwidth()])
        .padding(0.1);

      // Y Scale (Rupees Amount)
      const maxVal = d3.max(dataSlice, (d: ProjectFinancialData) => Math.max(d.revenue, d.totalExpenses)) || 100000;
      const yScale = d3.scaleLinear()
        .domain([0, maxVal * 1.15])
        .nice()
        .range([innerHeight, 0]);

      // Grid Lines
      g.append('g')
        .attr('class', 'grid-lines')
        .call(
          d3.axisLeft(yScale)
            .ticks(5)
            .tickSize(-innerWidth)
            .tickFormat(() => '')
        )
        .selectAll('line')
        .attr('stroke', '#16251b')
        .attr('stroke-dasharray', '3,3');

      // X Axis
      const xAxis = g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x0Scale));

      xAxis.selectAll('text')
        .attr('fill', '#94a3b8')
        .attr('font-size', '11px')
        .attr('transform', 'rotate(-20)')
        .attr('text-anchor', 'end')
        .attr('dx', '-0.5em')
        .attr('dy', '0.5em');

      xAxis.select('.domain').attr('stroke', '#1e3426');

      // Y Axis
      const yAxis = g.append('g')
        .call(d3.axisLeft(yScale).ticks(5).tickFormat((d) => `₹${Number(d) / 1000}k`));

      yAxis.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px');
      yAxis.select('.domain').attr('stroke', '#1e3426');

      // Group for Bars
      const projectGroups = g.selectAll('.project-group')
        .data(dataSlice)
        .enter()
        .append('g')
        .attr('class', 'project-group')
        .attr('transform', (d: ProjectFinancialData) => `translate(${x0Scale(d.coupleName)},0)`);

      // Sub Bar 1: Revenue (Emerald)
      projectGroups.append('rect')
        .attr('x', x1Scale('revenue') || 0)
        .attr('y', innerHeight)
        .attr('width', x1Scale.bandwidth())
        .attr('height', 0)
        .attr('fill', '#10b981')
        .attr('rx', 4)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d: any) {
          setHoveredProject(d as ProjectFinancialData);
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setTooltipPos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
          }
        })
        .on('mouseout', () => { setHoveredProject(null); setTooltipPos(null); })
        .transition()
        .duration(600)
        .attr('y', (d: any) => yScale((d as ProjectFinancialData).revenue))
        .attr('height', (d: any) => innerHeight - yScale((d as ProjectFinancialData).revenue));

      // Sub Bar 2: Expenses (Rose Red)
      projectGroups.append('rect')
        .attr('x', x1Scale('totalExpenses') || 0)
        .attr('y', innerHeight)
        .attr('width', x1Scale.bandwidth())
        .attr('height', 0)
        .attr('fill', '#ef4444')
        .attr('rx', 4)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d: any) {
          setHoveredProject(d as ProjectFinancialData);
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setTooltipPos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
          }
        })
        .on('mouseout', () => { setHoveredProject(null); setTooltipPos(null); })
        .transition()
        .duration(600)
        .attr('y', (d: any) => yScale((d as ProjectFinancialData).totalExpenses))
        .attr('height', (d: any) => innerHeight - yScale((d as ProjectFinancialData).totalExpenses));

      // Margin Badge on top of each group
      projectGroups.append('text')
        .attr('x', x0Scale.bandwidth() / 2)
        .attr('y', (d: any) => Math.min(yScale((d as ProjectFinancialData).revenue), yScale((d as ProjectFinancialData).totalExpenses)) - 8)
        .attr('text-anchor', 'middle')
        .attr('fill', (d: any) => getMarginColor((d as ProjectFinancialData).profitMarginPct))
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .text((d: any) => `${(d as ProjectFinancialData).profitMarginPct}%`);

    // ================= 3. D3 PROFIT MARGIN RANKING VIEW =================
    } else if (viewType === 'margin_rank') {
      const margin = { top: 20, right: 60, bottom: 30, left: 130 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

      // Sort data by profit margin descending
      const sortedData = [...filteredData].sort((a, b) => b.profitMarginPct - a.profitMarginPct).slice(0, 10);

      const yScale = d3.scaleBand()
        .domain(sortedData.map(d => d.coupleName))
        .range([0, innerHeight])
        .padding(0.25);

      const maxMargin = Math.max(100, d3.max(sortedData, d => d.profitMarginPct) || 100);
      const xScale = d3.scaleLinear()
        .domain([0, maxMargin])
        .range([0, innerWidth]);

      // Y Axis (Couple Names)
      const yAxis = g.append('g').call(d3.axisLeft(yScale));
      yAxis.selectAll('text').attr('fill', '#e2e8f0').attr('font-size', '11px').attr('font-weight', '500');
      yAxis.select('.domain').attr('stroke', '#1e3426');

      // Bars
      g.selectAll('.bar')
        .data(sortedData)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('y', (d: ProjectFinancialData) => yScale(d.coupleName) || 0)
        .attr('height', yScale.bandwidth())
        .attr('x', 0)
        .attr('width', 0)
        .attr('fill', (d: ProjectFinancialData) => getMarginColor(d.profitMarginPct))
        .attr('rx', 4)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d: any) {
          setHoveredProject(d as ProjectFinancialData);
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setTooltipPos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
          }
        })
        .on('mouseout', () => { setHoveredProject(null); setTooltipPos(null); })
        .transition()
        .duration(600)
        .attr('width', (d: any) => Math.max(4, xScale(Math.max(0, (d as ProjectFinancialData).profitMarginPct))));

      // Value labels at end of bars
      g.selectAll('.value-label')
        .data(sortedData)
        .enter()
        .append('text')
        .attr('y', (d: ProjectFinancialData) => (yScale(d.coupleName) || 0) + yScale.bandwidth() / 2 + 4)
        .attr('x', (d: ProjectFinancialData) => xScale(Math.max(0, d.profitMarginPct)) + 8)
        .attr('fill', (d: ProjectFinancialData) => getMarginColor(d.profitMarginPct))
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'sans-serif')
        .text((d: ProjectFinancialData) => `${d.profitMarginPct}% Margin (₹${(d.netProfit/1000).toFixed(0)}k Profit)`);
    }

  }, [filteredData, viewType]);

  return (
    <div className="bg-[#0b130e] border border-[#16251b] rounded-2xl p-4 sm:p-6 space-y-5 shadow-2xl relative">
      
      {/* Top Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#142218] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-[#eab308]/10 text-amber-400 border border-[#eab308]/20">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              PROJECT-WISE PROFIT MARGIN ANALYTICS
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            D3.js visualization comparing gross revenue against editor payouts & project expenses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Type Toggle */}
          <div className="flex bg-[#070c09] p-1 rounded-xl border border-[#16251b]">
            <button
              onClick={() => setViewType('treemap')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewType === 'treemap' ? 'bg-[#eab308] text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tile Area = Revenue, Tile Color = Margin %"
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>D3 Treemap</span>
            </button>

            <button
              onClick={() => setViewType('grouped_bar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewType === 'grouped_bar' ? 'bg-[#eab308] text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Revenue vs Total Expenses Bar Chart"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Revenue vs Exp</span>
            </button>

            <button
              onClick={() => setViewType('margin_rank')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewType === 'margin_rank' ? 'bg-[#eab308] text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Rank projects by Profit Margin %"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Margin Rank</span>
            </button>
          </div>

          {/* Status Filter Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#070c09] text-xs text-slate-300 border border-[#16251b] rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer font-medium"
          >
            <option value="active">Active Weddings</option>
            <option value="completed">Delivered & Closed</option>
            <option value="all">All Weddings</option>
          </select>
        </div>
      </div>

      {/* Summary Metrics Band */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#070c09]/70 rounded-xl p-3 border border-[#142218] text-xs">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Portfolio Revenue</span>
          <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">₹{summary.totalRevenue.toLocaleString('en-IN')}</p>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Total Expenses</span>
          <p className="text-sm font-bold text-rose-400 font-mono mt-0.5">₹{summary.totalExpenses.toLocaleString('en-IN')}</p>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Net Portfolio Profit</span>
          <p className="text-sm font-bold text-amber-400 font-mono mt-0.5">₹{summary.totalProfit.toLocaleString('en-IN')}</p>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Average Margin %</span>
          <div className="flex items-center space-x-1.5 mt-0.5">
            <span className="text-sm font-extrabold text-white font-mono">{summary.avgMargin}%</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20">
              {summary.count} Projects
            </span>
          </div>
        </div>
      </div>

      {/* Legend & Color Code */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 pt-1">
        <div className="flex items-center space-x-4">
          <span className="font-mono text-[10px] uppercase font-bold text-slate-500">Margin Legend:</span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span>
            <span>&gt;65% Excellent</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#84cc16]"></span>
            <span>45-65% Good</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]"></span>
            <span>25-45% Moderate</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span>
            <span>&lt;25% Low / Loss</span>
          </span>
        </div>

        {viewType === 'treemap' && (
          <span className="text-[10px] font-mono text-amber-400/80 italic">
            *Tile box area represents total project revenue
          </span>
        )}
      </div>

      {/* SVG Canvas Container */}
      <div ref={containerRef} className="relative w-full min-h-[400px] bg-[#070c09] rounded-xl border border-[#142218] overflow-hidden p-2">
        <svg ref={svgRef} className="w-full h-full"></svg>

        {/* D3 Hover Tooltip overlay */}
        {hoveredProject && tooltipPos && (
          <div 
            className="absolute z-50 pointer-events-none bg-[#0e1a12]/95 border border-amber-500/40 rounded-xl p-3.5 shadow-2xl text-xs w-64 backdrop-blur-md transition-all duration-75"
            style={{
              left: Math.min(tooltipPos.x + 15, (containerRef.current?.clientWidth || 300) - 270),
              top: Math.max(10, Math.min(tooltipPos.y - 100, 260))
            }}
          >
            <div className="border-b border-[#1b2c21] pb-2 mb-2 flex justify-between items-start">
              <div>
                <h4 className="font-bold text-white text-sm">{hoveredProject.coupleName}</h4>
                <p className="text-[10px] font-mono text-amber-400">{hoveredProject.studioName} • {hoveredProject.eventType}</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                hoveredProject.profitMarginPct >= 45 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {hoveredProject.profitMarginPct}% Margin
              </span>
            </div>

            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between items-center text-slate-300">
                <span>Project Revenue:</span>
                <span className="font-bold text-emerald-400">₹{hoveredProject.revenue.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between items-center text-slate-400">
                <span>Editor Payout:</span>
                <span className="text-slate-200">₹{hoveredProject.editorExpense.toLocaleString('en-IN')}</span>
              </div>

              {hoveredProject.otherExpense > 0 && (
                <div className="flex justify-between items-center text-slate-400">
                  <span>Other Expenses:</span>
                  <span className="text-slate-200">₹{hoveredProject.otherExpense.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-[#1b2c21]">
                <span>Total Expenses:</span>
                <span className="font-bold text-rose-400">₹{hoveredProject.totalExpenses.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between items-center text-amber-400 pt-1 border-t border-[#1b2c21] font-sans">
                <span className="font-bold">Net Profit Margin:</span>
                <span className="font-extrabold text-amber-400">₹{hoveredProject.netProfit.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default ProjectProfitMarginD3Chart;
