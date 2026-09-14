import { useState } from "react";
import {
  LayoutDashboard, FileSearch, AlertOctagon, ClipboardList,
  Settings, Shield, Users,
  Bell, Search, HelpCircle, ChevronDown, ChevronRight,
  Clock, CheckCircle, XCircle, TrendingDown,
  Download, BookOpen, Globe, LogOut,
  Lock, Megaphone, ArrowUpRight, RefreshCw,
  CheckSquare, Square, X, Plus, Trash2,
  Eye, AlertTriangle, Edit3, KeyRound,
  ShieldCheck, ShieldOff, Filter, ArrowLeft,
  ZoomIn, Play, Pause, ExternalLink, MessageSquare, Menu,
} from "lucide-react";
import {
  XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, AreaChart, Area,
} from "recharts";

// ─── Nav ──────────────────────────────────────────────────────────────────────
const NAV = [
  { key:"dashboard",  icon:LayoutDashboard, label:"工作台首页",   badge:null },
  { key:"review",     icon:FileSearch,      label:"广告审核列表", badge:48   },
  { key:"violations", icon:AlertOctagon,    label:"违规素材库",   badge:null },
  { key:"logs",       icon:ClipboardList,   label:"审核记录日志", badge:null },
];
const NAV_CONFIG = [{ key:"audit-config", icon:Settings, label:"审核配置" }];
const NAV_ADMIN  = [{ key:"accounts",     icon:Users,    label:"账号权限"  }];

const PAGE_TITLE: Record<string, { title: string; sub: string }> = {
  dashboard:      { title:"工作台首页",   sub:"今日共待审 48 条" },
  review:         { title:"广告审核列表", sub:"全部广告 · 多维筛选" },
  violations:     { title:"违规素材库",   sub:"驳回/强制下架素材归档" },
  logs:           { title:"审核记录日志", sub:"所有审核操作留痕" },
  "audit-config": { title:"审核配置",    sub:"话术模板 · 违禁词 · 禁投行业" },
  accounts:       { title:"账号权限",    sub:"账号管理 · 角色权限配置" },
};

// ─── Types ────────────────────────────────────────────────────────────────────
type AdStatus = "pending" | "approved" | "rejected" | "removed";
type AdRow = { id:string; name:string; advertiser:string; slot:string; industry:string; submittedAt:string; status:AdStatus; violation:string; thumb:string; urgent:boolean; timeout:boolean; };
type LogAction = "approved"|"rejected"|"removed";
type LogRow = { id:string; adName:string; advertiser:string; action:LogAction; reviewer:string; time:string; remark:string; };
type Template  = { id:number; name:string; content:string; enabled:boolean; createdAt:string; };
type Keyword   = { id:number; word:string; level:"高"|"中"|"低"; createdAt:string; };
type Industry  = { id:number; name:string; remark:string; enabled:boolean; createdAt:string; };
type AccountRole   = "reviewer"|"admin";
type AccountStatus = "active"|"disabled";
type Account = { id:number; username:string; name:string; role:AccountRole; status:AccountStatus; createdAt:string; lastLogin:string; };
type ViolationItem = { id:number; adName:string; advertiser:string; violationType:"rejected"|"removed"; remark:string; handledAt:string; thumb:string; };
type AdDetailExtra = { campaignName:string; mediaType:"image"|"video"; dateRange:string; targetAudience:string; contactInfo:string; landingPage:string; adTitle:string; adDescription:string; history:{ reviewer:string; action:"rejected"|"approved"; remark:string; time:string }[]; };

// ─── Mock Data ────────────────────────────────────────────────────────────────
const HOUR_DATA = [
  {h:"08:00",通过:12,驳回:3},{h:"09:00",通过:28,驳回:8},{h:"10:00",通过:45,驳回:14},
  {h:"11:00",通过:38,驳回:9},{h:"12:00",通过:22,驳回:5},{h:"13:00",通过:31,驳回:7},
  {h:"14:00",通过:52,驳回:18},{h:"15:00",通过:47,驳回:12},{h:"16:00",通过:39,驳回:11},
  {h:"17:00",通过:28,驳回:6},{h:"18:00",通过:14,驳回:3},
];
const VIOLATIONS_TOP = [
  {type:"使用极限词/夸大宣传",count:34,pct:38,color:"#7c3aed"},
  {type:"素材尺寸/格式不符",  count:22,pct:25,color:"#2563eb"},
  {type:"含竞品 Logo/商标",   count:16,pct:18,color:"#c026d3"},
  {type:"虚假促销信息",       count:11,pct:12,color:"#4f46e5"},
  {type:"违规行业广告内容",   count:6, pct:7, color:"#0891b2"},
];
type AdItem = {id:string;name:string;advertiser:string;submittedAt:string;urgent:boolean;timeout:boolean;thumb:string;category:string;};
const ADS: AdItem[] = [
  {id:"AD-20260629-001",name:"618超级品牌日——全场5折起，爆款直降！",  advertiser:"京东商城",   submittedAt:"09:12",urgent:true, timeout:false,thumb:"🛍️",category:"电商促销"},
  {id:"AD-20260629-002",name:"美白祛斑精华液·7天见效·皮肤科推荐",     advertiser:"完美日记",   submittedAt:"09:35",urgent:true, timeout:false,thumb:"✨", category:"美妆护肤"},
  {id:"AD-20260629-003",name:"0手续费·秒到账·最高额度30万",           advertiser:"借呗金融",   submittedAt:"08:47",urgent:false,timeout:true, thumb:"💰", category:"金融贷款"},
  {id:"AD-20260629-004",name:"国内外机票特惠·提前预订立省40%",         advertiser:"携程旅行",   submittedAt:"10:03",urgent:false,timeout:false,thumb:"✈️", category:"旅游出行"},
  {id:"AD-20260629-005",name:"在家轻松月入过万·零基础入门·名师亲授",  advertiser:"职场达人",   submittedAt:"08:22",urgent:false,timeout:true, thumb:"📚", category:"教育培训"},
  {id:"AD-20260629-006",name:"AI 办公效率工具·免费试用30天",          advertiser:"AiOffice",   submittedAt:"10:28",urgent:false,timeout:false,thumb:"🤖", category:"SaaS软件"},
  {id:"AD-20260629-007",name:"高端私家医疗·专家坐诊·一键预约就诊",   advertiser:"平安好医",   submittedAt:"09:55",urgent:true, timeout:false,thumb:"🏥", category:"医疗健康"},
  {id:"AD-20260629-008",name:"超低延迟电竞外设·职业选手同款装备",      advertiser:"ROG玩家国度",submittedAt:"10:15",urgent:false,timeout:false,thumb:"🎮", category:"数码3C"},
];
const NOTICES = [
  {type:"update",text:"审核规则更新：医疗类广告新增禁用词 12 项，请注意核查",time:"今天 09:00"},
  {type:"alert", text:"今日加急广告共 6 条，请优先处理",                   time:"今天 08:30"},
  {type:"info",  text:"新功能上线：批量驳回支持一键选择话术模板",           time:"昨天 18:00"},
];
const ALL_ADS: AdRow[] = [
  {id:"AD-001",name:"618超级品牌日——全场5折起",    advertiser:"京东商城",   slot:"首页焦点图",industry:"电商零售",submittedAt:"2026-06-29 09:12",status:"pending", violation:"",        thumb:"🛍️",urgent:true, timeout:false},
  {id:"AD-002",name:"美白祛斑精华液·7天见效",       advertiser:"完美日记",   slot:"信息流广告",industry:"美妆护肤",submittedAt:"2026-06-29 09:35",status:"approved",violation:"",        thumb:"✨", urgent:false,timeout:false},
  {id:"AD-003",name:"0手续费·秒到账·最高额度30万", advertiser:"借呗金融",   slot:"侧边栏广告",industry:"金融贷款",submittedAt:"2026-06-29 08:47",status:"rejected",violation:"夸大宣传",thumb:"💰", urgent:false,timeout:true },
  {id:"AD-004",name:"国内外机票特惠·立省40%",       advertiser:"携程旅行",   slot:"搜索结果页",industry:"旅游出行",submittedAt:"2026-06-29 10:03",status:"pending", violation:"",        thumb:"✈️", urgent:false,timeout:false},
  {id:"AD-005",name:"在家轻松月入过万·名师亲授",    advertiser:"职场达人",   slot:"弹窗广告",  industry:"教育培训",submittedAt:"2026-06-29 08:22",status:"removed", violation:"虚假宣传",thumb:"📚", urgent:false,timeout:true },
  {id:"AD-006",name:"AI办公工具·免费试用30天",      advertiser:"AiOffice",   slot:"Banner广告",industry:"软件服务",submittedAt:"2026-06-29 10:28",status:"pending", violation:"",        thumb:"🤖", urgent:false,timeout:false},
  {id:"AD-007",name:"高端私家医疗·专家坐诊",        advertiser:"平安好医",   slot:"首页焦点图",industry:"医疗健康",submittedAt:"2026-06-29 09:55",status:"pending", violation:"",        thumb:"🏥", urgent:true, timeout:false},
  {id:"AD-008",name:"电竞外设·职业选手同款装备",    advertiser:"ROG玩家国度",slot:"信息流广告",industry:"数码3C",  submittedAt:"2026-06-29 10:15",status:"approved",violation:"",        thumb:"🎮", urgent:false,timeout:false},
  {id:"AD-009",name:"新能源汽车·限时优惠·立省2万", advertiser:"比亚迪",     slot:"视频贴片",  industry:"汽车",    submittedAt:"2026-06-29 11:00",status:"pending", violation:"",        thumb:"🚗", urgent:false,timeout:false},
  {id:"AD-010",name:"有机蔬菜配送·当日达",          advertiser:"叮咚买菜",   slot:"信息流广告",industry:"生鲜食品",submittedAt:"2026-06-29 11:22",status:"rejected",violation:"格式不符",thumb:"🥦", urgent:false,timeout:false},
];
const AD_DETAIL_EXTRAS: Record<string,AdDetailExtra> = {
  "AD-001":{campaignName:"618大促-品牌曝光计划",mediaType:"image",dateRange:"2026-06-18 ～ 2026-07-18",targetAudience:"18-45岁 · 全国 · 购物兴趣人群",contactInfo:"张经理 · bd@jd.com · 010-8888-8888",landingPage:"https://www.jd.com/618",adTitle:"618超级品牌日——全场5折起，爆款直降！",adDescription:"京东618年中大促，精选爆款全场5折起，还有满减券、免息分期等多重优惠，数量有限，先到先得！限时特供价，抢完即止。",history:[]},
  "AD-002":{campaignName:"完美日记-夏日美妆计划",mediaType:"image",dateRange:"2026-07-01 ～ 2026-07-31",targetAudience:"18-35岁女性 · 一二线城市 · 美妆兴趣",contactInfo:"李小姐 · media@pmc.com · 021-5555-6666",landingPage:"https://www.perfectdiary.com/summer",adTitle:"美白祛斑精华液·7天见效·皮肤科推荐",adDescription:"经国家皮肤科权威认证，添加烟酰胺、维C等多种美白成分，坚持使用7天，肌肤焕然一新。",history:[]},
  "AD-003":{campaignName:"借呗金融-贷款推广Q2",mediaType:"image",dateRange:"2026-06-01 ～ 2026-06-30",targetAudience:"25-50岁 · 全国 · 金融理财兴趣",contactInfo:"王总 · ads@borrowai.com · 0755-9999-0000",landingPage:"https://www.borrowai.com/loan",adTitle:"0手续费·秒到账·最高额度30万",adDescription:"注册即可申请，最高额度30万，秒审秒放，0手续费，超低利率，随借随还。",history:[{reviewer:"陈晓雨",action:"rejected",remark:"广告中「最高额度30万」等字样存在夸大宣传，违反金融广告相关规定，请修改后重新提交。",time:"2026-06-15 11:30"}]},
  "AD-004":{campaignName:"携程旅行-暑期机票促销",mediaType:"image",dateRange:"2026-07-01 ～ 2026-08-31",targetAudience:"20-55岁 · 全国 · 旅游出行兴趣",contactInfo:"陈总监 · bd@trip.com · 021-3456-7890",landingPage:"https://www.trip.com/flights",adTitle:"国内外机票特惠·提前预订立省40%",adDescription:"暑期出行季，提前锁定特惠价，国内外热门航线低至5折，多买多优惠。",history:[]},
  "AD-006":{campaignName:"AiOffice-企业SaaS推广",mediaType:"video",dateRange:"2026-06-29 ～ 2026-09-30",targetAudience:"25-45岁 · 企业决策者 · 效率工具兴趣",contactInfo:"产品团队 · growth@aioffice.io · —",landingPage:"https://www.aioffice.io/trial",adTitle:"AI办公工具·免费试用30天",adDescription:"基于大语言模型的新一代办公助手，一键生成报告、PPT、数据分析，让工作效率提升300%。",history:[]},
  "AD-007":{campaignName:"平安好医-私人医生招募",mediaType:"image",dateRange:"2026-07-01 ～ 2026-12-31",targetAudience:"30-60岁 · 一线城市 · 医疗健康兴趣",contactInfo:"市场部 · mkt@paah.com · 010-6666-7777",landingPage:"https://www.pinganhealth.com/vip",adTitle:"高端私家医疗·专家坐诊·一键预约",adDescription:"汇聚全国三甲医院专家资源，提供全科私人医生服务，健康管理、24小时在线问诊、绿色通道就医。",history:[]},
  "AD-009":{campaignName:"比亚迪-暑期购车季",mediaType:"video",dateRange:"2026-07-01 ～ 2026-08-31",targetAudience:"25-50岁 · 全国 · 汽车购买意向",contactInfo:"全国经销商 · ads@byd.com · 400-666-8888",landingPage:"https://www.byd.com/summer",adTitle:"新能源汽车·限时优惠·立省2万",adDescription:"暑期购车享专属补贴，汉EV/宋PLUS/元PLUS全系优惠，置换享额外补贴5000元。",history:[]},
};
const DEFAULT_EXTRA: AdDetailExtra = {campaignName:"广告计划",mediaType:"image",dateRange:"2026-07-01 ～ 2026-07-31",targetAudience:"全年龄段 · 全国",contactInfo:"广告主 · contact@example.com · —",landingPage:"https://example.com",adTitle:"广告标题",adDescription:"广告描述文案",history:[]};

const LOG_DATA: LogRow[] = [
  {id:"LOG-001",adName:"美白祛斑精华液·7天见效",      advertiser:"完美日记",   action:"approved",reviewer:"陈晓雨",time:"2026-06-29 14:22",remark:"符合规范，素材合格"},
  {id:"LOG-002",adName:"0手续费·秒到账·最高额度30万",advertiser:"借呗金融",   action:"rejected",reviewer:"陈晓雨",time:"2026-06-29 13:55",remark:"存在夸大收益宣传"},
  {id:"LOG-003",adName:"电竞外设·职业选手同款装备",  advertiser:"ROG玩家国度",action:"approved",reviewer:"王芳",  time:"2026-06-29 13:30",remark:""},
  {id:"LOG-004",adName:"在家轻松月入过万",            advertiser:"职场达人",   action:"removed", reviewer:"李明",  time:"2026-06-29 12:10",remark:"虚假宣传，强制下架"},
  {id:"LOG-005",adName:"有机蔬菜配送·当日达",        advertiser:"叮咚买菜",   action:"rejected",reviewer:"陈晓雨",time:"2026-06-29 11:48",remark:"素材尺寸不符合规范"},
  {id:"LOG-006",adName:"新能源汽车·限时优惠",        advertiser:"比亚迪",     action:"approved",reviewer:"王芳",  time:"2026-06-29 10:55",remark:"合格"},
];
const INIT_TEMPLATES: Template[] = [
  {id:1,name:"夸大宣传",    content:"您的广告存在夸大宣传的内容，违反广告法第X条，请修改后重新提交。",  enabled:true, createdAt:"2026-05-01"},
  {id:2,name:"虚假信息",    content:"广告中包含虚假或误导性信息，请核实后重新提交。",                  enabled:true, createdAt:"2026-05-08"},
  {id:3,name:"素材格式不符",content:"上传素材不符合平台规格要求，请参考《素材规范》重新制作后提交。",  enabled:true, createdAt:"2026-05-15"},
  {id:4,name:"违规行业",    content:"您的广告属于本平台禁止投放的行业类目，无法通过审核。",            enabled:false,createdAt:"2026-06-01"},
];
const INIT_KEYWORDS: Keyword[] = [
  {id:1,word:"最低价",  level:"高",createdAt:"2026-05-01"},{id:2,word:"第一名",  level:"高",createdAt:"2026-05-02"},
  {id:3,word:"无副作用",level:"高",createdAt:"2026-05-03"},{id:4,word:"立即暴富",level:"高",createdAt:"2026-05-04"},
  {id:5,word:"100%有效",level:"中",createdAt:"2026-05-10"},{id:6,word:"绝对安全",level:"中",createdAt:"2026-05-11"},
  {id:7,word:"全国最大",level:"中",createdAt:"2026-05-12"},{id:8,word:"权威认证",level:"低",createdAt:"2026-06-01"},
];
const INIT_INDUSTRIES: Industry[] = [
  {id:1,name:"P2P网贷",    remark:"已被监管机构明令禁止",enabled:true, createdAt:"2026-01-01"},
  {id:2,name:"网络博彩",   remark:"涉及赌博，严禁投放",  enabled:true, createdAt:"2026-01-01"},
  {id:3,name:"烟草及电子烟",remark:"未成年人保护相关限制",enabled:true, createdAt:"2026-01-15"},
  {id:4,name:"虚拟货币",   remark:"金融监管要求",        enabled:true, createdAt:"2026-02-01"},
  {id:5,name:"医疗器械",   remark:"需要额外资质认证",    enabled:false,createdAt:"2026-03-01"},
];
const INIT_ACCOUNTS: Account[] = [
  {id:1,username:"chenxy",  name:"陈晓雨",role:"admin",   status:"active",  createdAt:"2026-01-10",lastLogin:"2026-06-29 14:22"},
  {id:2,username:"wangfang",name:"王芳",  role:"reviewer",status:"active",  createdAt:"2026-02-15",lastLogin:"2026-06-29 13:30"},
  {id:3,username:"liming",  name:"李明",  role:"reviewer",status:"active",  createdAt:"2026-03-01",lastLogin:"2026-06-29 12:10"},
  {id:4,username:"zhangwei",name:"张伟",  role:"reviewer",status:"disabled",createdAt:"2026-04-01",lastLogin:"2026-06-15 09:00"},
];
const INIT_VIOLATIONS: ViolationItem[] = [
  {id:1,adName:"在家轻松月入过万·零基础入门",advertiser:"职场达人",violationType:"removed", remark:"虚假宣传，诱导用户",         handledAt:"2026-06-29 12:10",thumb:"📚"},
  {id:2,adName:"0手续费·秒到账·最高额度30万",advertiser:"借呗金融",violationType:"rejected",remark:"夸大贷款收益，违反金融广告规定",handledAt:"2026-06-29 13:55",thumb:"💰"},
  {id:3,adName:"有机蔬菜配送·当日达",         advertiser:"叮咚买菜",violationType:"rejected",remark:"素材尺寸不符合平台规范",       handledAt:"2026-06-29 11:48",thumb:"🥦"},
  {id:4,adName:"快速暴富·无风险投资项目",     advertiser:"某财富",  violationType:"removed", remark:"涉嫌金融诈骗，强制下架",       handledAt:"2026-06-28 16:30",thumb:"💹"},
  {id:5,adName:"特效祛痘霜·三天见效·无副作用",advertiser:"护肤秘方",violationType:"rejected",remark:"使用极限词，违反广告法",       handledAt:"2026-06-28 11:20",thumb:"🧴"},
];

// ─── Shared styles ────────────────────────────────────────────────────────────
const glass: React.CSSProperties = {
  background:"rgba(255,255,255,0.58)",backdropFilter:"blur(32px) saturate(180%)",WebkitBackdropFilter:"blur(32px) saturate(180%)",
  border:"1px solid rgba(255,255,255,0.78)",boxShadow:"0 4px 24px rgba(124,92,252,0.08), inset 0 1px 0 rgba(255,255,255,0.92)",
};
const glassStrong: React.CSSProperties = {
  background:"rgba(255,255,255,0.72)",backdropFilter:"blur(40px) saturate(200%)",WebkitBackdropFilter:"blur(40px) saturate(200%)",
  border:"1px solid rgba(255,255,255,0.88)",boxShadow:"0 8px 32px rgba(124,92,252,0.10), inset 0 1px 0 rgba(255,255,255,0.96)",
};
function Shimmer() {
  return <div className="absolute inset-x-0 top-0 h-px pointer-events-none" style={{background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.95),transparent)"}}/>;
}

// ─── Dropdowns ────────────────────────────────────────────────────────────────
function NotifDropdown() {
  const items = [
    {icon:"🛍️",text:"京东商城 提交了新广告，等待审核",    time:"3 分钟前", dot:true },
    {icon:"⚠️",text:"AD-003 已超时 2 小时，请立即处理",   time:"1 小时前", dot:true },
    {icon:"✅",text:"今日审核进度：已完成 68%，共 127 条", time:"系统通知", dot:false},
    {icon:"📋",text:"审核规则已更新，医疗类新增 12 项禁用词",time:"今天 09:00",dot:false},
  ];
  return (
    <div className="absolute top-full right-0 mt-2 w-[300px] sm:w-[320px] rounded-2xl z-[200] overflow-hidden" style={glassStrong}>
      <Shimmer/>
      <div className="px-4 py-3 flex items-center justify-between" style={{borderBottom:"1px solid rgba(124,92,252,0.1)"}}>
        <span className="text-xs font-semibold text-[#1e1b4b]">待办通知</span>
        <span className="text-[10px] text-violet-500 font-medium cursor-pointer hover:underline">全部标已读</span>
      </div>
      {items.map((n,i)=>(
        <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-violet-50/50 cursor-pointer transition-colors" style={{borderBottom:i<items.length-1?"1px solid rgba(124,92,252,0.06)":"none"}}>
          <div className="text-base shrink-0 mt-0.5">{n.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-[#3d3568] leading-relaxed">{n.text}</div>
            <div className="text-[10px] text-[#b0aac8] mt-0.5">{n.time}</div>
          </div>
          {n.dot && <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0 mt-1"/>}
        </div>
      ))}
    </div>
  );
}
function UserDropdown() {
  return (
    <div className="absolute top-full right-0 mt-2 w-44 rounded-2xl z-[200] overflow-hidden" style={glassStrong}>
      <Shimmer/>
      {[{icon:Lock,label:"修改密码"},{icon:Settings,label:"账号设置"},{icon:LogOut,label:"退出登录"}].map((item,i)=>(
        <button key={i} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-[#3d3568] hover:bg-violet-50 transition-colors text-left" style={i===2?{borderTop:"1px solid rgba(124,92,252,0.1)",color:"#ef4444"}:{}}>
          <item.icon size={13} style={i===2?{color:"#ef4444"}:{color:"#8b83b8"}}/>{item.label}
        </button>
      ))}
    </div>
  );
}

// ─── Ad card (mobile list item) ───────────────────────────────────────────────
function AdCard({ ad, onViewDetail, onReject }: { ad: AdRow; onViewDetail: ()=>void; onReject: ()=>void }) {
  const statusMap: Record<AdStatus,{label:string;cls:string}> = {
    pending: {label:"待审核",cls:"bg-amber-50 text-amber-600"},
    approved:{label:"已通过",cls:"bg-emerald-50 text-emerald-600"},
    rejected:{label:"已驳回",cls:"bg-red-50 text-red-500"},
    removed: {label:"已下架",cls:"bg-gray-100 text-gray-500"},
  };
  const st = statusMap[ad.status];
  return (
    <div className="relative rounded-2xl p-4 overflow-hidden" style={glassStrong}>
      <Shimmer/>
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{background:"rgba(237,233,255,0.6)",border:"1px solid rgba(124,92,252,0.12)"}}>{ad.thumb}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            {ad.urgent  && <span className="text-[9px] bg-red-50   text-red-500   font-semibold px-1.5 py-0.5 rounded-full">加急</span>}
            {ad.timeout && <span className="text-[9px] bg-amber-50 text-amber-500 font-semibold px-1.5 py-0.5 rounded-full">超时</span>}
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
          </div>
          <div className="text-sm font-semibold text-[#1e1b4b] leading-snug">{ad.name}</div>
          <div className="text-[11px] text-[#8b83b8] mt-0.5">{ad.advertiser} · {ad.slot}</div>
          <div className="text-[10px] text-[#b0aac8] mt-0.5">{ad.submittedAt}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 pt-3" style={{borderTop:"1px solid rgba(124,92,252,0.08)"}}>
        {ad.status==="pending" && <>
          <button className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold text-white" style={{background:"linear-gradient(135deg,#10b981,#059669)",boxShadow:"0 3px 10px rgba(16,185,129,0.3)"}}><CheckCircle size={13}/>通过</button>
          <button onClick={onReject} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold text-white" style={{background:"linear-gradient(135deg,#f43f5e,#e11d48)",boxShadow:"0 3px 10px rgba(244,63,94,0.3)"}}><XCircle size={13}/>驳回</button>
        </>}
        <button onClick={onViewDetail} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium" style={{background:"rgba(237,233,255,0.8)",color:"#6d28d9",border:"1px solid rgba(124,92,252,0.2)"}}><Eye size={13}/>详情</button>
      </div>
    </div>
  );
}

// ─── Dashboard todo table ─────────────────────────────────────────────────────
function TodoTable({ tab, onViewDetail }: { tab:string; onViewDetail:(ad:AdRow)=>void }) {
  const data = tab==="urgent" ? ADS.filter(a=>a.urgent) : tab==="timeout" ? ADS.filter(a=>a.timeout) : ADS;
  const handleReview = (ad: AdItem) => {
    const matched = ALL_ADS.find(a=>a.advertiser===ad.advertiser&&a.status==="pending") ?? ALL_ADS.find(a=>a.status==="pending") ?? ALL_ADS[0];
    onViewDetail(matched);
  };
  return (
    <>
      {/* Mobile: cards */}
      <div className="md:hidden p-3 flex flex-col gap-3">
        {data.map(ad => {
          const matched = ALL_ADS.find(a=>a.advertiser===ad.advertiser&&a.status==="pending") ?? ALL_ADS.find(a=>a.status==="pending") ?? ALL_ADS[0];
          return (
            <div key={ad.id} className="relative rounded-2xl p-4 overflow-hidden" style={glassStrong}>
              <Shimmer/>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{background:"rgba(237,233,255,0.6)",border:"1px solid rgba(124,92,252,0.12)"}}>{ad.thumb}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    {ad.urgent  && <span className="text-[9px] bg-red-50   text-red-500   font-semibold px-1.5 py-0.5 rounded-full">加急</span>}
                    {ad.timeout && <span className="text-[9px] bg-amber-50 text-amber-500 font-semibold px-1.5 py-0.5 rounded-full">超时</span>}
                    <span className="text-[9px] bg-amber-50 text-amber-600 font-semibold px-1.5 py-0.5 rounded-full">待审核</span>
                  </div>
                  <div className="text-sm font-semibold text-[#1e1b4b] leading-snug">{ad.name}</div>
                  <div className="text-[11px] text-[#8b83b8] mt-0.5">{ad.advertiser} · {ad.category}</div>
                  <div className="text-[10px] text-[#b0aac8] mt-0.5">今日 {ad.submittedAt}</div>
                </div>
              </div>
              <button onClick={()=>onViewDetail(matched)} className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white" style={{background:"linear-gradient(135deg,#7c3aed,#6366f1)",boxShadow:"0 3px 10px rgba(124,92,252,0.3)"}}>
                <Eye size={14}/>去审核
              </button>
            </div>
          );
        })}
      </div>
      {/* Desktop: table */}
      <div className="hidden md:block">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr style={{background:"rgba(237,233,255,0.7)"}}>
              {["素材","广告名称","广告主","分类","提交时间","状态","操作"].map(h=>(
                <th key={h} className="px-3 py-2.5 text-left font-semibold text-[#4c3d9e] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((ad,ri)=>(
              <tr key={ad.id} className="hover:bg-violet-50/40 transition-colors" style={{background:ri%2===0?"rgba(255,255,255,0.35)":"rgba(248,246,255,0.35)"}}>
                <td className="px-3 py-2.5"><div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{background:"rgba(237,233,255,0.6)",border:"1px solid rgba(124,92,252,0.12)"}}>{ad.thumb}</div></td>
                <td className="px-3 py-2.5" style={{maxWidth:240}}>
                  <div className="flex items-center gap-2">
                    {ad.urgent  && <span className="text-[9px] bg-red-50   text-red-500   font-semibold px-1.5 py-0.5 rounded-full shrink-0">加急</span>}
                    {ad.timeout && <span className="text-[9px] bg-amber-50 text-amber-500 font-semibold px-1.5 py-0.5 rounded-full shrink-0">超时</span>}
                    <span className="text-[#1e1b4b] font-medium truncate">{ad.name}</span>
                  </div>
                  <div className="text-[10px] text-[#b0aac8] mt-0.5">{ad.id}</div>
                </td>
                <td className="px-3 py-2.5 font-medium text-[#3d3568] whitespace-nowrap">{ad.advertiser}</td>
                <td className="px-3 py-2.5"><span className="text-[10px] bg-violet-50 text-violet-500 font-medium px-2 py-0.5 rounded-full whitespace-nowrap">{ad.category}</span></td>
                <td className="px-3 py-2.5 text-[10px] text-[#8b83b8] whitespace-nowrap"><span className="flex items-center gap-1"><Clock size={9}/>今日 {ad.submittedAt}</span></td>
                <td className="px-3 py-2.5"><span className="flex items-center gap-1 text-[10px] text-amber-500 font-medium"><AlertTriangle size={9}/>待审核</span></td>
                <td className="px-3 py-2.5">
                  <button onClick={()=>handleReview(ad)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-white whitespace-nowrap hover:scale-105 transition-all" style={{background:"linear-gradient(135deg,#7c3aed,#6366f1)",boxShadow:"0 3px 10px rgba(124,92,252,0.3)"}}>
                    <Eye size={11}/>去审核
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
function ChartTip({active,payload,label}: any) {
  if (!active||!payload?.length) return null;
  return (
    <div style={{background:"rgba(30,27,75,0.88)",backdropFilter:"blur(8px)",borderRadius:10,padding:"8px 12px",color:"#fff",fontSize:11}}>
      <div className="font-semibold mb-1">{label}</div>
      {payload.map((p:any)=><div key={p.name} style={{color:p.color}} className="flex items-center gap-2">{p.name}<span className="ml-auto font-semibold text-white">{p.value}</span></div>)}
    </div>
  );
}

// ─── AdDetailPage ─────────────────────────────────────────────────────────────
function AdDetailPage({ad,onBack}: {ad:AdRow; onBack:()=>void}) {
  const extra = AD_DETAIL_EXTRAS[ad.id] ?? DEFAULT_EXTRA;
  const [showApprove, setShowApprove] = useState(false);
  const [showReject,  setShowReject]  = useState(false);
  const [rejectRemark,  setRejectRemark]  = useState("");
  const [selectedTpl,   setSelectedTpl]   = useState<number|null>(null);
  const [zoomed,  setZoomed]  = useState(false);
  const [playing, setPlaying] = useState(false);
  const [approved, setApproved] = useState(false);
  const [rejected, setRejected] = useState(false);

  const isPending = ad.status==="pending" && !approved && !rejected;

  const infoRows: {label:string; value:React.ReactNode}[] = [
    {label:"广告计划名称",   value:<span className="font-semibold text-[#1e1b4b]">{extra.campaignName}</span>},
    {label:"广告主企业名称", value:<span className="font-medium text-[#3d3568]">{ad.advertiser}</span>},
    {label:"投放广告位",     value:<span className="text-[10px] bg-violet-50 text-violet-500 font-medium px-2 py-0.5 rounded-full">{ad.slot}</span>},
    {label:"素材类型",       value:<span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${extra.mediaType==="video"?"bg-blue-50 text-blue-500":"bg-emerald-50 text-emerald-600"}`}>{extra.mediaType==="video"?"视频":"图片"}</span>},
    {label:"投放时间段",     value:<span className="text-[#3d3568]">{extra.dateRange}</span>},
    {label:"定向人群",       value:<span className="text-[#3d3568]">{extra.targetAudience}</span>},
    {label:"提交时间",       value:<span className="text-[#8b83b8]">{ad.submittedAt}</span>},
    {label:"当前状态",       value: approved?<span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">已通过</span>:rejected?<span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-500">已驳回</span>:ad.status==="pending"?<span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">待审核</span>:ad.status==="approved"?<span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">已通过</span>:<span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-500">已驳回</span>},
    {label:"广告主联系信息", value:<span className="text-[#3d3568]">{extra.contactInfo}</span>},
    {label:"落地页链接",     value:(
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[10px] text-violet-500 truncate max-w-[130px]">{extra.landingPage}</span>
        <a href={extra.landingPage} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 px-2 py-1 rounded-lg text-[9px] font-medium whitespace-nowrap shrink-0" style={{background:"rgba(237,233,255,0.8)",color:"#6d28d9",border:"1px solid rgba(124,92,252,0.2)"}}>
          <ExternalLink size={9}/>打开
        </a>
      </div>
    )},
  ];

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-5 flex flex-col gap-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:scale-[1.02]" style={{background:"rgba(255,255,255,0.72)",border:"1px solid rgba(255,255,255,0.88)",boxShadow:"0 2px 8px rgba(124,92,252,0.08)",color:"#6d28d9"}}>
          <ArrowLeft size={13}/>返回
        </button>
        <div className="flex items-center gap-1.5 text-xs text-[#8b83b8]">
          <button onClick={onBack} className="hover:text-violet-500 transition-colors hidden sm:inline">广告审核列表</button>
          <ChevronRight size={11} className="text-[#c4b9fc] hidden sm:inline"/>
          <span className="text-[#1e1b4b] font-semibold">广告详情</span>
        </div>
        {ad.urgent  && <span className="text-[9px] bg-red-50   text-red-500   font-semibold px-2 py-0.5 rounded-full">加急</span>}
        {ad.timeout && <span className="text-[9px] bg-amber-50 text-amber-500 font-semibold px-2 py-0.5 rounded-full">超时</span>}
      </div>

      {/* Mobile: actions at top for quick access */}
      <div className="md:hidden relative rounded-2xl overflow-hidden" style={glassStrong}>
        <Shimmer/>
        <div className="px-4 py-3.5 flex items-center gap-2" style={{borderBottom:"1px solid rgba(255,255,255,0.6)"}}>
          <div className="w-7 h-7 rounded-xl bg-violet-50 flex items-center justify-center shrink-0"><CheckCircle size={14} className="text-violet-500"/></div>
          <div className="text-sm font-bold text-[#1e1b4b]">审核操作</div>
        </div>
        <div className="p-4">
          {approved ? (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{background:"rgba(236,253,245,0.8)",border:"1px solid rgba(16,185,129,0.2)"}}><CheckCircle size={14} className="text-emerald-500"/><span className="text-sm font-semibold text-emerald-600">已通过审核</span></div>
          ) : rejected ? (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{background:"rgba(255,241,242,0.8)",border:"1px solid rgba(239,68,68,0.2)"}}><XCircle size={14} className="text-red-500"/><span className="text-sm font-semibold text-red-500">已驳回，已通知广告主</span></div>
          ) : (
            <div className="flex gap-2">
              <button onClick={()=>setShowApprove(true)} disabled={!isPending} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-40" style={{background:"linear-gradient(135deg,#10b981,#059669)",boxShadow:"0 4px 14px rgba(16,185,129,0.35)"}}><CheckCircle size={16}/>通过</button>
              <button onClick={()=>setShowReject(true)}  disabled={!isPending} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-40" style={{background:"linear-gradient(135deg,#f43f5e,#e11d48)",boxShadow:"0 4px 14px rgba(244,63,94,0.35)"}}><XCircle size={16}/>驳回</button>
              <button disabled className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl text-xs font-semibold text-[#b0aac8] cursor-not-allowed" style={{background:"rgba(240,240,245,0.6)",border:"1px solid rgba(180,176,220,0.3)"}} title="广告尚未上线">
                <ShieldOff size={14}/><span className="hidden sm:inline">强制下架</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col md:flex-row gap-4 min-h-0 flex-1">
        {/* Left */}
        <div className="w-full md:w-[300px] md:shrink-0 flex flex-col gap-4">
          {/* Basic info */}
          <div className="relative rounded-2xl overflow-hidden" style={glassStrong}>
            <Shimmer/>
            <div className="px-4 sm:px-5 py-3.5 flex items-center gap-2" style={{borderBottom:"1px solid rgba(255,255,255,0.6)"}}>
              <div className="w-7 h-7 rounded-xl bg-violet-50 flex items-center justify-center shrink-0"><MessageSquare size={14} className="text-violet-500"/></div>
              <div className="text-sm font-bold text-[#1e1b4b]">广告基础信息</div>
            </div>
            <div className="px-4 sm:px-5 py-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-3">
              {infoRows.map((row,i)=>(
                <div key={i} className="flex flex-col gap-0.5">
                  <div className="text-[9px] font-semibold text-[#b0aac8] uppercase tracking-wide">{row.label}</div>
                  <div className="text-xs">{row.value}</div>
                </div>
              ))}
            </div>
          </div>
          {/* History */}
          <div className="relative rounded-2xl overflow-hidden" style={glassStrong}>
            <Shimmer/>
            <div className="px-4 sm:px-5 py-3.5 flex items-center gap-2" style={{borderBottom:"1px solid rgba(255,255,255,0.6)"}}>
              <div className="w-7 h-7 rounded-xl bg-amber-50 flex items-center justify-center shrink-0"><Clock size={14} className="text-amber-500"/></div>
              <div className="text-sm font-bold text-[#1e1b4b]">历史审核记录</div>
            </div>
            <div className="px-4 sm:px-5 py-4">
              {extra.history.length===0 ? (
                <div className="text-center py-4">
                  <div className="text-[10px] text-[#b0aac8]">暂无历史审核记录</div>
                  <div className="text-[9px] text-[#c4b9fc] mt-1">这是该广告首次提交</div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {extra.history.map((h,i)=>(
                    <div key={i} className="flex flex-col gap-1.5 px-3 py-2.5 rounded-xl" style={{background:"rgba(237,233,255,0.4)",border:"1px solid rgba(124,92,252,0.08)"}}>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0">{h.reviewer[0]}</div>
                        <span className="text-[11px] font-semibold text-[#1e1b4b]">{h.reviewer}</span>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ml-auto ${h.action==="rejected"?"bg-red-50 text-red-500":"bg-emerald-50 text-emerald-600"}`}>{h.action==="rejected"?"驳回":"通过"}</span>
                      </div>
                      <p className="text-[11px] text-[#8b83b8] leading-relaxed pl-7">{h.remark}</p>
                      <div className="text-[9px] text-[#b0aac8] pl-7">{h.time}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Media preview */}
          <div className="relative rounded-2xl overflow-hidden flex-1 flex flex-col" style={glassStrong}>
            <Shimmer/>
            <div className="px-4 sm:px-5 py-3.5 flex items-center justify-between shrink-0" style={{borderBottom:"1px solid rgba(255,255,255,0.6)"}}>
              <div>
                <div className="text-sm font-bold text-[#1e1b4b]">广告创意素材</div>
                <div className="text-[10px] text-[#8b83b8] mt-0.5">{extra.mediaType==="video"?"视频素材 · 点击播放预览":"图片素材 · 点击放大查看"}</div>
              </div>
              <span className={`text-[9px] font-semibold px-2 py-1 rounded-full ${extra.mediaType==="video"?"bg-blue-50 text-blue-500":"bg-violet-50 text-violet-500"}`}>{extra.mediaType==="video"?"VIDEO":"IMAGE"}</span>
            </div>
            <div className="flex-1 flex flex-col p-4 sm:p-5 gap-4 min-h-0">
              {extra.mediaType==="image" ? (
                <div className="relative rounded-2xl overflow-hidden cursor-zoom-in group min-h-[160px] sm:min-h-[220px] flex-1" style={{background:"linear-gradient(135deg,rgba(237,233,255,0.8),rgba(221,214,254,0.5))",border:"1px solid rgba(124,92,252,0.15)"}} onClick={()=>setZoomed(true)}>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="text-6xl sm:text-7xl">{ad.thumb}</div>
                    <div className="text-xs font-semibold text-[#4c3d9e] px-4 text-center">{extra.adTitle}</div>
                  </div>
                  <div className="absolute inset-0 bg-violet-900/0 group-hover:bg-violet-900/8 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-white font-medium" style={{background:"rgba(124,92,252,0.85)",backdropFilter:"blur(8px)"}}>
                      <ZoomIn size={13}/>点击放大
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden min-h-[160px] sm:min-h-[220px] flex-1" style={{background:"linear-gradient(135deg,rgba(219,234,254,0.8),rgba(191,219,254,0.5))",border:"1px solid rgba(37,99,235,0.15)"}}>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="text-6xl sm:text-7xl">{ad.thumb}</div>
                    <button onClick={()=>setPlaying(!playing)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white" style={{background:"linear-gradient(135deg,#2563eb,#3b82f6)",boxShadow:"0 4px 12px rgba(37,99,235,0.35)"}}>
                      {playing?<><Pause size={13}/>暂停</>:<><Play size={13}/>播放视频</>}
                    </button>
                    {playing && <div className="text-[10px] text-blue-500 font-medium">▶ 正在播放 · 00:15 / 00:30</div>}
                  </div>
                </div>
              )}
              <div className="shrink-0 px-4 py-3 rounded-xl" style={{background:"rgba(237,233,255,0.45)",border:"1px solid rgba(124,92,252,0.1)"}}>
                <div className="text-[9px] font-semibold text-[#b0aac8] uppercase tracking-wide mb-2">广告文案</div>
                <div className="text-xs font-semibold text-[#1e1b4b] mb-1">{extra.adTitle}</div>
                <div className="text-[11px] text-[#8b83b8] leading-relaxed">{extra.adDescription}</div>
              </div>
            </div>
          </div>

          {/* Desktop review actions */}
          <div className="hidden md:block relative rounded-2xl overflow-hidden shrink-0" style={glassStrong}>
            <Shimmer/>
            <div className="px-5 py-3.5 flex items-center gap-2" style={{borderBottom:"1px solid rgba(255,255,255,0.6)"}}>
              <div className="w-7 h-7 rounded-xl bg-violet-50 flex items-center justify-center shrink-0"><CheckCircle size={14} className="text-violet-500"/></div>
              <div className="text-sm font-bold text-[#1e1b4b]">审核操作区</div>
            </div>
            <div className="px-5 py-4 flex items-center gap-3 flex-wrap">
              {approved ? (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{background:"rgba(236,253,245,0.8)",border:"1px solid rgba(16,185,129,0.2)"}}><CheckCircle size={14} className="text-emerald-500"/><span className="text-sm font-semibold text-emerald-600">已通过审核，广告将自动上线</span></div>
              ) : rejected ? (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{background:"rgba(255,241,242,0.8)",border:"1px solid rgba(239,68,68,0.2)"}}><XCircle size={14} className="text-red-500"/><span className="text-sm font-semibold text-red-500">已驳回，已通知广告主并归入违规素材库</span></div>
              ) : (
                <>
                  <button onClick={()=>setShowApprove(true)} disabled={!isPending} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed" style={{background:"linear-gradient(135deg,#10b981,#059669)",boxShadow:isPending?"0 4px 16px rgba(16,185,129,0.35)":"none"}}><CheckCircle size={15}/>通过</button>
                  <button onClick={()=>setShowReject(true)}  disabled={!isPending} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed" style={{background:"linear-gradient(135deg,#f43f5e,#e11d48)",boxShadow:isPending?"0 4px 16px rgba(244,63,94,0.35)":"none"}}><XCircle size={15}/>驳回</button>
                  <button disabled className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#b0aac8] cursor-not-allowed ml-auto" style={{background:"rgba(240,240,245,0.6)",border:"1px solid rgba(180,176,220,0.3)"}} title="广告尚未上线"><ShieldOff size={15}/>强制下架<span className="text-[9px] font-normal ml-1">(未上线)</span></button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showApprove && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4" style={{background:"rgba(30,27,75,0.35)",backdropFilter:"blur(8px)"}}>
          <div className="relative w-full sm:w-[400px] rounded-t-3xl sm:rounded-3xl p-6 overflow-hidden" style={glassStrong}>
            <Shimmer/>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0"><CheckCircle size={20} className="text-emerald-500"/></div>
              <div><div className="text-sm font-bold text-[#1e1b4b]">确认通过</div><div className="text-[10px] text-[#8b83b8] mt-0.5">通过后广告将自动上线投放</div></div>
            </div>
            <div className="px-4 py-3 rounded-xl mb-5 text-xs text-[#3d3568] leading-relaxed" style={{background:"rgba(236,253,245,0.6)",border:"1px solid rgba(16,185,129,0.15)"}}>
              确认通过广告：<span className="font-semibold text-[#1e1b4b]">{ad.name}</span>，该广告将自动上线并开始投放。
            </div>
            <div className="flex gap-2">
              <button onClick={()=>setShowApprove(false)} className="flex-1 py-3 rounded-xl text-sm font-medium text-[#8b83b8] hover:bg-violet-50 transition-colors">取消</button>
              <button onClick={()=>{setApproved(true);setShowApprove(false)}} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white" style={{background:"linear-gradient(135deg,#10b981,#059669)",boxShadow:"0 3px 10px rgba(16,185,129,0.3)"}}>确认通过</button>
            </div>
          </div>
        </div>
      )}
      {showReject && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4" style={{background:"rgba(30,27,75,0.35)",backdropFilter:"blur(8px)"}}>
          <div className="relative w-full sm:w-[500px] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 overflow-hidden" style={glassStrong}>
            <Shimmer/>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center shrink-0"><XCircle size={20} className="text-red-500"/></div>
                <div><div className="text-sm font-bold text-[#1e1b4b]">驳回广告</div><div className="text-[10px] text-[#8b83b8] mt-0.5">驳回后自动归入违规素材库并通知广告主</div></div>
              </div>
              <button onClick={()=>{setShowReject(false);setRejectRemark("");setSelectedTpl(null)}} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"><X size={14} className="text-[#8b83b8]"/></button>
            </div>
            <div className="mb-4">
              <div className="text-xs font-semibold text-[#4c3d9e] mb-2">选择驳回话术模板</div>
              <div className="flex flex-col gap-1.5">
                {INIT_TEMPLATES.filter(t=>t.enabled).map(t=>(
                  <button key={t.id} onClick={()=>{setSelectedTpl(t.id);setRejectRemark(t.content)}} className="text-left px-3 py-2.5 rounded-xl text-xs text-[#3d3568] transition-colors" style={{background:selectedTpl===t.id?"rgba(237,233,255,0.9)":"rgba(237,233,255,0.4)",border:selectedTpl===t.id?"1px solid rgba(124,92,252,0.35)":"1px solid rgba(124,92,252,0.1)"}}>
                    <span className="font-semibold text-violet-600">{t.name}：</span><span className="text-[#8b83b8]">{t.content.slice(0,45)}…</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-5">
              <div className="text-xs font-semibold text-[#4c3d9e] mb-2">自定义补充备注</div>
              <textarea value={rejectRemark} onChange={e=>setRejectRemark(e.target.value)} rows={3} placeholder="请输入驳回原因…" className="w-full px-3 py-2.5 rounded-xl text-xs text-[#3d3568] placeholder-[#b0aac8] outline-none resize-none" style={{background:"rgba(240,238,255,0.55)",border:"1px solid rgba(124,92,252,0.16)",fontFamily:"inherit"}}/>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>{setShowReject(false);setRejectRemark("");setSelectedTpl(null)}} className="flex-1 py-3 rounded-xl text-sm font-medium text-[#8b83b8] hover:bg-violet-50 transition-colors">取消</button>
              <button onClick={()=>{if(rejectRemark.trim()){setRejected(true);setShowReject(false)}}} disabled={!rejectRemark.trim()} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed" style={{background:"linear-gradient(135deg,#f43f5e,#e11d48)",boxShadow:"0 3px 10px rgba(244,63,94,0.3)"}}>确认驳回</button>
            </div>
          </div>
        </div>
      )}
      {zoomed && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" style={{background:"rgba(10,8,40,0.75)",backdropFilter:"blur(12px)"}} onClick={()=>setZoomed(false)}>
          <div className="relative w-full max-w-[600px] rounded-3xl overflow-hidden flex items-center justify-center" style={{background:"linear-gradient(135deg,rgba(237,233,255,0.95),rgba(221,214,254,0.9))",border:"1px solid rgba(124,92,252,0.25)"}}>
            <button onClick={()=>setZoomed(false)} className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-white/60 hover:bg-white/90 transition-colors"><X size={15} className="text-[#4c3d9e]"/></button>
            <div className="flex flex-col items-center justify-center gap-4 p-12">
              <div className="text-8xl">{ad.thumb}</div>
              <div className="text-sm font-semibold text-[#4c3d9e] text-center">{extra.adTitle}</div>
              <div className="text-xs text-[#8b83b8] text-center max-w-sm">{extra.adDescription}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ReviewListPage ────────────────────────────────────────────────────────────
function ReviewListPage({onViewDetail}: {onViewDetail:(ad:AdRow)=>void}) {
  const [search,     setSearch]     = useState("");
  const [statusTab,  setStatusTab]  = useState<"all"|AdStatus>("all");
  const [rejectTarget, setRejectTarget] = useState<string|null>(null);
  const [rejectRemark, setRejectRemark] = useState("");

  const STATUS_TABS = [
    {k:"all",     label:"全部",   shortLabel:"全部"},
    {k:"pending", label:"待审核", shortLabel:"待审"},
    {k:"approved",label:"已通过", shortLabel:"通过"},
    {k:"rejected",label:"已驳回", shortLabel:"驳回"},
    {k:"removed", label:"已下架", shortLabel:"下架"},
  ];
  const counts = {all:ALL_ADS.length,pending:ALL_ADS.filter(a=>a.status==="pending").length,approved:ALL_ADS.filter(a=>a.status==="approved").length,rejected:ALL_ADS.filter(a=>a.status==="rejected").length,removed:ALL_ADS.filter(a=>a.status==="removed").length};
  const filtered = ALL_ADS.filter(a=>(statusTab==="all"||a.status===statusTab)&&(!search||a.name.includes(search)||a.advertiser.includes(search)||a.id.includes(search)));

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-5 flex flex-col gap-4">
      {/* Search bar */}
      <div className="relative rounded-2xl px-4 py-3 overflow-hidden flex items-center gap-2 shrink-0" style={glassStrong}>
        <Shimmer/>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1" style={{background:"rgba(240,238,255,0.55)",border:"1px solid rgba(124,92,252,0.16)"}}>
          <Search size={13} className="text-violet-400 shrink-0"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜索广告名称、广告主…" className="bg-transparent outline-none text-xs text-[#3d3568] placeholder-[#b0aac8] flex-1" style={{fontFamily:"inherit"}}/>
          {search && <button onClick={()=>setSearch("")}><X size={11} className="text-[#b0aac8]"/></button>}
        </div>
        <button className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-white whitespace-nowrap" style={{background:"linear-gradient(135deg,#7c3aed,#6366f1)",boxShadow:"0 2px 8px rgba(124,92,252,0.3)"}}><Filter size={12}/><span className="hidden sm:inline">筛选</span></button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-1 overflow-x-auto shrink-0 pb-1" style={{scrollbarWidth:"none"}}>
        {STATUS_TABS.map(t=>(
          <button key={t.k} onClick={()=>setStatusTab(t.k as any)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0" style={statusTab===t.k?{background:"linear-gradient(135deg,#7c3aed,#6366f1)",color:"#fff",boxShadow:"0 2px 8px rgba(124,92,252,0.28)"}:{background:"rgba(255,255,255,0.55)",color:"#8b83b8",border:"1px solid rgba(255,255,255,0.78)"}}>
            <span className="sm:hidden">{t.shortLabel}</span>
            <span className="hidden sm:inline">{t.label}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${statusTab===t.k?"bg-white/25 text-white":"bg-violet-50 text-violet-400"}`}>{counts[t.k as keyof typeof counts]}</span>
          </button>
        ))}
      </div>

      {/* Mobile: card list */}
      <div className="md:hidden flex flex-col gap-3">
        {filtered.map(ad=>(
          <AdCard key={ad.id} ad={ad} onViewDetail={()=>onViewDetail(ad)} onReject={()=>setRejectTarget(ad.id)}/>
        ))}
        {filtered.length===0 && <div className="text-center py-12 text-sm text-[#b0aac8]">暂无匹配广告</div>}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:flex relative flex-1 rounded-2xl overflow-hidden flex-col" style={glass}>
        <Shimmer/>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs border-collapse" style={{minWidth:820}}>
            <thead>
              <tr style={{background:"rgba(237,233,255,0.7)"}}>
                {["素材","广告名称","广告主","行业","广告位","提交时间","状态","操作"].map(h=>(
                  <th key={h} className="px-3 py-2.5 text-left font-semibold text-[#4c3d9e] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((ad,ri)=>(
                <tr key={ad.id} className="hover:bg-violet-50/40 transition-colors" style={{background:ri%2===0?"rgba(255,255,255,0.35)":"rgba(248,246,255,0.35)"}}>
                  <td className="px-3 py-2.5"><div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{background:"rgba(237,233,255,0.6)",border:"1px solid rgba(124,92,252,0.12)"}}>{ad.thumb}</div></td>
                  <td className="px-3 py-2.5" style={{maxWidth:200}}>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {ad.urgent  && <span className="text-[9px] bg-red-50   text-red-500   font-semibold px-1.5 py-0.5 rounded-full shrink-0">加急</span>}
                      {ad.timeout && <span className="text-[9px] bg-amber-50 text-amber-500 font-semibold px-1.5 py-0.5 rounded-full shrink-0">超时</span>}
                      <span className="text-[#1e1b4b] font-medium truncate">{ad.name}</span>
                    </div>
                    <div className="text-[10px] text-[#b0aac8] mt-0.5">{ad.id}</div>
                  </td>
                  <td className="px-3 py-2.5 font-medium text-[#3d3568] whitespace-nowrap">{ad.advertiser}</td>
                  <td className="px-3 py-2.5"><span className="text-[10px] bg-violet-50 text-violet-500 font-medium px-2 py-0.5 rounded-full whitespace-nowrap">{ad.industry}</span></td>
                  <td className="px-3 py-2.5 text-[10px] text-[#8b83b8] whitespace-nowrap">{ad.slot}</td>
                  <td className="px-3 py-2.5 text-[10px] text-[#8b83b8] whitespace-nowrap">{ad.submittedAt}</td>
                  <td className="px-3 py-2.5">
                    {{pending:{label:"待审核",cls:"bg-amber-50 text-amber-600"},approved:{label:"已通过",cls:"bg-emerald-50 text-emerald-600"},rejected:{label:"已驳回",cls:"bg-red-50 text-red-500"},removed:{label:"已下架",cls:"bg-gray-100 text-gray-500"}}[ad.status] && <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${{pending:"bg-amber-50 text-amber-600",approved:"bg-emerald-50 text-emerald-600",rejected:"bg-red-50 text-red-500",removed:"bg-gray-100 text-gray-500"}[ad.status]}`}>{({pending:"待审核",approved:"已通过",rejected:"已驳回",removed:"已下架"})[ad.status]}</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1 flex-nowrap">
                      {ad.status==="pending" && <>
                        <button className="flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium text-white whitespace-nowrap" style={{background:"linear-gradient(135deg,#10b981,#059669)"}}><CheckCircle size={10}/>通过</button>
                        <button onClick={()=>setRejectTarget(ad.id)} className="flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium text-white whitespace-nowrap" style={{background:"linear-gradient(135deg,#f43f5e,#e11d48)"}}><XCircle size={10}/>驳回</button>
                      </>}
                      <button onClick={()=>onViewDetail(ad)} className="flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap" style={{background:"rgba(237,233,255,0.8)",color:"#6d28d9",border:"1px solid rgba(124,92,252,0.2)"}}><Eye size={10}/>详情</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4" style={{background:"rgba(30,27,75,0.35)",backdropFilter:"blur(8px)"}}>
          <div className="relative w-full sm:w-[480px] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 overflow-hidden" style={glassStrong}>
            <Shimmer/>
            <div className="flex items-center justify-between mb-5">
              <div><div className="text-sm font-bold text-[#1e1b4b]">驳回广告</div><div className="text-[10px] text-[#8b83b8] mt-0.5">选择驳回原因或填写自定义备注</div></div>
              <button onClick={()=>{setRejectTarget(null);setRejectRemark("")}} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"><X size={14} className="text-[#8b83b8]"/></button>
            </div>
            <div className="mb-4">
              <div className="text-xs font-semibold text-[#4c3d9e] mb-2">快速选择话术</div>
              <div className="flex flex-col gap-1.5">
                {INIT_TEMPLATES.filter(t=>t.enabled).map(t=>(
                  <button key={t.id} onClick={()=>setRejectRemark(t.content)} className="text-left px-3 py-2.5 rounded-xl text-xs text-[#3d3568] hover:bg-violet-50 transition-colors" style={{background:"rgba(237,233,255,0.5)",border:"1px solid rgba(124,92,252,0.1)"}}>
                    <span className="font-semibold text-violet-600">{t.name}：</span>{t.content.slice(0,40)}…
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-5">
              <div className="text-xs font-semibold text-[#4c3d9e] mb-2">驳回备注</div>
              <textarea value={rejectRemark} onChange={e=>setRejectRemark(e.target.value)} rows={3} placeholder="请输入驳回原因…" className="w-full px-3 py-2.5 rounded-xl text-xs text-[#3d3568] placeholder-[#b0aac8] outline-none resize-none" style={{background:"rgba(240,238,255,0.55)",border:"1px solid rgba(124,92,252,0.16)",fontFamily:"inherit"}}/>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>{setRejectTarget(null);setRejectRemark("")}} className="flex-1 py-3 rounded-xl text-sm font-medium text-[#8b83b8] hover:bg-violet-50 transition-colors">取消</button>
              <button className="flex-1 py-3 rounded-xl text-sm font-medium text-white" style={{background:"linear-gradient(135deg,#f43f5e,#e11d48)",boxShadow:"0 3px 10px rgba(244,63,94,0.3)"}}>确认驳回</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ViolationsPage ────────────────────────────────────────────────────────────
function ViolationsPage() {
  const [violations,   setViolations]   = useState(INIT_VIOLATIONS);
  const [editTarget,   setEditTarget]   = useState<ViolationItem|null>(null);
  const [editRemark,   setEditRemark]   = useState("");
  const [deleteTarget, setDeleteTarget] = useState<number|null>(null);
  const [filter, setFilter] = useState("all");
  const filtered = violations.filter(v=>filter==="all"||v.violationType===filter);
  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-5 flex flex-col gap-4">
      <div className="relative rounded-2xl px-4 py-3 overflow-hidden flex items-center gap-3 flex-wrap shrink-0" style={glassStrong}>
        <Shimmer/>
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{background:"rgba(255,255,255,0.55)",border:"1px solid rgba(255,255,255,0.78)"}}>
          {[{k:"all",l:"全部",c:violations.length},{k:"rejected",l:"审核驳回",c:violations.filter(v=>v.violationType==="rejected").length},{k:"removed",l:"强制下架",c:violations.filter(v=>v.violationType==="removed").length}].map(t=>(
            <button key={t.k} onClick={()=>setFilter(t.k)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all" style={filter===t.k?{background:"linear-gradient(135deg,#7c3aed,#6366f1)",color:"#fff",boxShadow:"0 2px 8px rgba(124,92,252,0.28)"}:{color:"#8b83b8"}}>
              {t.l}<span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${filter===t.k?"bg-white/25 text-white":"bg-violet-50 text-violet-400"}`}>{t.c}</span>
            </button>
          ))}
        </div>
        <div className="ml-auto text-xs text-[#8b83b8]">共 <span className="font-semibold text-violet-500">{violations.length}</span> 条</div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex flex-col gap-3">
        {filtered.map(v=>(
          <div key={v.id} className="relative rounded-2xl p-4 overflow-hidden" style={glassStrong}>
            <Shimmer/>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{background:"rgba(237,233,255,0.6)",border:"1px solid rgba(124,92,252,0.12)"}}>{v.thumb}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${v.violationType==="removed"?"bg-red-50 text-red-500":"bg-amber-50 text-amber-600"}`}>{v.violationType==="removed"?"强制下架":"审核驳回"}</span>
                </div>
                <div className="text-sm font-semibold text-[#1e1b4b] leading-snug">{v.adName}</div>
                <div className="text-[11px] text-[#8b83b8] mt-0.5">{v.advertiser}</div>
                <div className="text-[11px] text-[#8b83b8] mt-1 leading-relaxed">{v.remark}</div>
                <div className="text-[10px] text-[#b0aac8] mt-1">{v.handledAt}</div>
              </div>
            </div>
            <div className="flex gap-2 mt-3 pt-3" style={{borderTop:"1px solid rgba(124,92,252,0.08)"}}>
              <button onClick={()=>{setEditTarget(v);setEditRemark(v.remark)}} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium" style={{background:"rgba(237,233,255,0.8)",color:"#6d28d9",border:"1px solid rgba(124,92,252,0.2)"}}><Edit3 size={12}/>编辑</button>
              <button onClick={()=>setDeleteTarget(v.id)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium bg-red-50 text-red-500" style={{border:"1px solid rgba(239,68,68,0.2)"}}><Trash2 size={12}/>删除</button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block relative flex-1 rounded-2xl overflow-hidden" style={glass}>
        <Shimmer/>
        <div className="overflow-auto">
          <table className="w-full text-xs border-collapse" style={{minWidth:720}}>
            <thead><tr style={{background:"rgba(237,233,255,0.7)"}}>{["素材","广告名称","广告主","违规类型","违规备注","处理时间","操作"].map(h=><th key={h} className="px-4 py-2.5 text-left font-semibold text-[#4c3d9e] whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((v,ri)=>(
                <tr key={v.id} className="hover:bg-violet-50/40 transition-colors" style={{background:ri%2===0?"rgba(255,255,255,0.35)":"rgba(248,246,255,0.35)"}}>
                  <td className="px-4 py-2.5"><div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{background:"rgba(237,233,255,0.6)",border:"1px solid rgba(124,92,252,0.12)"}}>{v.thumb}</div></td>
                  <td className="px-4 py-2.5 font-medium text-[#1e1b4b]" style={{maxWidth:180}}><span className="truncate block">{v.adName}</span></td>
                  <td className="px-4 py-2.5 text-[#3d3568] whitespace-nowrap">{v.advertiser}</td>
                  <td className="px-4 py-2.5"><span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${v.violationType==="removed"?"bg-red-50 text-red-500":"bg-amber-50 text-amber-600"}`}>{v.violationType==="removed"?"强制下架":"审核驳回"}</span></td>
                  <td className="px-4 py-2.5 text-[11px] text-[#8b83b8]" style={{maxWidth:200}}><span className="truncate block">{v.remark}</span></td>
                  <td className="px-4 py-2.5 text-[10px] text-[#8b83b8] whitespace-nowrap">{v.handledAt}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1 flex-nowrap">
                      <button onClick={()=>{setEditTarget(v);setEditRemark(v.remark)}} className="flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap" style={{background:"rgba(237,233,255,0.8)",color:"#6d28d9",border:"1px solid rgba(124,92,252,0.2)"}}><Edit3 size={10}/>编辑</button>
                      <button onClick={()=>setDeleteTarget(v.id)} className="flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap bg-red-50 text-red-500" style={{border:"1px solid rgba(239,68,68,0.2)"}}><Trash2 size={10}/>删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editTarget && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4" style={{background:"rgba(30,27,75,0.35)",backdropFilter:"blur(8px)"}}>
          <div className="relative w-full sm:w-[420px] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 overflow-hidden" style={glassStrong}>
            <Shimmer/>
            <div className="flex items-center justify-between mb-4"><div className="text-sm font-bold text-[#1e1b4b]">编辑违规备注</div><button onClick={()=>setEditTarget(null)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50"><X size={14} className="text-[#8b83b8]"/></button></div>
            <div className="mb-2 text-xs text-[#8b83b8]">{editTarget.adName}</div>
            <textarea value={editRemark} onChange={e=>setEditRemark(e.target.value)} rows={4} className="w-full px-3 py-2.5 rounded-xl text-xs text-[#3d3568] outline-none resize-none mb-5" style={{background:"rgba(240,238,255,0.55)",border:"1px solid rgba(124,92,252,0.16)",fontFamily:"inherit"}}/>
            <div className="flex gap-2">
              <button onClick={()=>setEditTarget(null)} className="flex-1 py-3 rounded-xl text-sm font-medium text-[#8b83b8] hover:bg-violet-50 transition-colors">取消</button>
              <button onClick={()=>{setViolations(p=>p.map(x=>x.id===editTarget.id?{...x,remark:editRemark}:x));setEditTarget(null)}} className="flex-1 py-3 rounded-xl text-sm font-medium text-white" style={{background:"linear-gradient(135deg,#7c3aed,#6366f1)"}}>保存</button>
            </div>
          </div>
        </div>
      )}
      {deleteTarget!==null && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4" style={{background:"rgba(30,27,75,0.35)",backdropFilter:"blur(8px)"}}>
          <div className="relative w-full sm:w-[360px] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 overflow-hidden" style={glassStrong}>
            <Shimmer/>
            <div className="text-sm font-bold text-[#1e1b4b] mb-2">确认删除</div>
            <p className="text-xs text-[#8b83b8] mb-5">删除后该违规记录将从素材库中移除，此操作不可撤销。</p>
            <div className="flex gap-2">
              <button onClick={()=>setDeleteTarget(null)} className="flex-1 py-3 rounded-xl text-sm font-medium text-[#8b83b8] hover:bg-violet-50 transition-colors">取消</button>
              <button onClick={()=>{setViolations(p=>p.filter(x=>x.id!==deleteTarget));setDeleteTarget(null)}} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white" style={{background:"linear-gradient(135deg,#f43f5e,#e11d48)"}}>确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LogsPage ─────────────────────────────────────────────────────────────────
function LogsPage() {
  const [search,       setSearch]       = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const filtered = LOG_DATA.filter(l=>(actionFilter==="all"||l.action===actionFilter)&&(!search||l.adName.includes(search)||l.advertiser.includes(search)||l.reviewer.includes(search)));
  const actionBadge = (a:LogAction) => {const m={approved:{label:"通过",cls:"bg-emerald-50 text-emerald-600"},rejected:{label:"驳回",cls:"bg-red-50 text-red-500"},removed:{label:"下架",cls:"bg-gray-100 text-gray-500"}}[a];return <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${m.cls}`}>{m.label}</span>;};
  const summaryCards = [
    {label:"今日总操作",value:LOG_DATA.length,              color:"text-violet-600"},
    {label:"通过",      value:LOG_DATA.filter(l=>l.action==="approved").length,color:"text-emerald-500"},
    {label:"驳回",      value:LOG_DATA.filter(l=>l.action==="rejected").length,color:"text-red-500"},
    {label:"下架",      value:LOG_DATA.filter(l=>l.action==="removed").length, color:"text-gray-500"},
  ];
  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-5 flex flex-col gap-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
        {summaryCards.map((c,i)=>(
          <div key={i} className="relative flex items-center gap-3 px-4 py-3.5 rounded-2xl overflow-hidden" style={glassStrong}>
            <Shimmer/><div className="relative"><div className={`text-2xl font-bold ${c.color}`}>{c.value}</div><div className="text-[11px] text-[#1e1b4b] font-medium">{c.label}</div></div>
          </div>
        ))}
      </div>
      <div className="relative rounded-2xl px-4 py-3 overflow-hidden flex items-center gap-2 flex-wrap shrink-0" style={glassStrong}>
        <Shimmer/>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-[160px]" style={{background:"rgba(240,238,255,0.55)",border:"1px solid rgba(124,92,252,0.16)"}}>
          <Search size={13} className="text-violet-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜索广告名称…" className="bg-transparent outline-none text-xs text-[#3d3568] placeholder-[#b0aac8] flex-1" style={{fontFamily:"inherit"}}/>{search && <button onClick={()=>setSearch("")}><X size={11} className="text-[#b0aac8]"/></button>}
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{background:"rgba(255,255,255,0.55)",border:"1px solid rgba(255,255,255,0.78)"}}>
          {[{k:"all",l:"全部"},{k:"approved",l:"通过"},{k:"rejected",l:"驳回"},{k:"removed",l:"下架"}].map(t=>(
            <button key={t.k} onClick={()=>setActionFilter(t.k)} className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all" style={actionFilter===t.k?{background:"linear-gradient(135deg,#7c3aed,#6366f1)",color:"#fff",boxShadow:"0 2px 8px rgba(124,92,252,0.28)"}:{color:"#8b83b8"}}>{t.l}</button>
          ))}
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex flex-col gap-3">
        {filtered.map(l=>(
          <div key={l.id} className="relative rounded-2xl p-4 overflow-hidden" style={glassStrong}>
            <Shimmer/>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-[11px] font-bold shrink-0">{l.reviewer[0]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  {actionBadge(l.action)}
                  <span className="text-[10px] text-[#b0aac8]">{l.reviewer} · {l.time}</span>
                </div>
                <div className="text-sm font-semibold text-[#1e1b4b] leading-snug">{l.adName}</div>
                <div className="text-[11px] text-[#8b83b8] mt-0.5">{l.advertiser}</div>
                {l.remark && <div className="text-[11px] text-[#8b83b8] mt-1 italic">{l.remark}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block relative flex-1 rounded-2xl overflow-hidden" style={glass}>
        <Shimmer/>
        <div className="overflow-auto">
          <table className="w-full text-xs border-collapse" style={{minWidth:700}}>
            <thead><tr style={{background:"rgba(237,233,255,0.7)"}}>{["广告名称","广告主","操作类型","操作人","操作时间","备注"].map(h=><th key={h} className="px-4 py-2.5 text-left font-semibold text-[#4c3d9e] whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((l,ri)=>(
                <tr key={l.id} className="hover:bg-violet-50/40 transition-colors" style={{background:ri%2===0?"rgba(255,255,255,0.35)":"rgba(248,246,255,0.35)"}}>
                  <td className="px-4 py-2.5 font-medium text-[#1e1b4b]" style={{maxWidth:200}}><span className="truncate block">{l.adName}</span></td>
                  <td className="px-4 py-2.5 text-[#3d3568] whitespace-nowrap">{l.advertiser}</td>
                  <td className="px-4 py-2.5">{actionBadge(l.action)}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap"><div className="flex items-center gap-1.5"><div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">{l.reviewer[0]}</div><span className="text-[#3d3568]">{l.reviewer}</span></div></td>
                  <td className="px-4 py-2.5 text-[10px] text-[#8b83b8] whitespace-nowrap">{l.time}</td>
                  <td className="px-4 py-2.5 text-[11px] text-[#8b83b8]" style={{maxWidth:200}}><span className="truncate block">{l.remark||"—"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── AuditConfigPage ──────────────────────────────────────────────────────────
function AuditConfigPage() {
  const [templates,  setTemplates]  = useState(INIT_TEMPLATES);
  const [keywords,   setKeywords]   = useState(INIT_KEYWORDS);
  const [industries, setIndustries] = useState(INIT_INDUSTRIES);
  const [addKw, setAddKw] = useState("");
  const [addKwLevel, setAddKwLevel] = useState<"高"|"中"|"低">("高");
  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-5 flex flex-col gap-4 sm:gap-5">
      <div className="relative rounded-2xl overflow-hidden" style={glassStrong}>
        <Shimmer/>
        <div className="px-4 sm:px-5 py-4 flex items-center justify-between" style={{borderBottom:"1px solid rgba(255,255,255,0.6)"}}>
          <div><div className="text-sm font-bold text-[#1e1b4b]">驳回话术模板</div><div className="text-[10px] text-[#8b83b8] mt-0.5 hidden sm:block">审核驳回时快速选用，减少重复输入</div></div>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white" style={{background:"linear-gradient(135deg,#7c3aed,#6366f1)",boxShadow:"0 2px 8px rgba(124,92,252,0.3)"}}><Plus size={13}/>新增</button>
        </div>
        <div className="p-4 sm:p-5 flex flex-col gap-3">
          {templates.map(t=>(
            <div key={t.id} className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{background:"rgba(237,233,255,0.4)",border:"1px solid rgba(124,92,252,0.08)"}}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap"><span className="text-xs font-semibold text-[#1e1b4b]">{t.name}</span><span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${t.enabled?"bg-emerald-50 text-emerald-600":"bg-gray-100 text-gray-500"}`}>{t.enabled?"启用":"停用"}</span></div>
                <p className="text-[11px] text-[#8b83b8] leading-relaxed">{t.content}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={()=>setTemplates(p=>p.map(x=>x.id===t.id?{...x,enabled:!x.enabled}:x))} className={`px-2.5 py-1 rounded-lg text-[10px] font-medium ${t.enabled?"bg-gray-100 text-gray-500":"bg-emerald-50 text-emerald-600"}`}>{t.enabled?"停用":"启用"}</button>
                <button onClick={()=>setTemplates(p=>p.filter(x=>x.id!==t.id))} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 hover:text-red-500 text-[#8b83b8] transition-colors"><Trash2 size={13}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative rounded-2xl overflow-hidden" style={glassStrong}>
        <Shimmer/>
        <div className="px-4 sm:px-5 py-4 flex items-center justify-between flex-wrap gap-2" style={{borderBottom:"1px solid rgba(255,255,255,0.6)"}}>
          <div><div className="text-sm font-bold text-[#1e1b4b]">违禁词库管理</div><div className="text-[10px] text-[#8b83b8] mt-0.5 hidden sm:block">命中违禁词将自动标记，辅助审核员判定</div></div>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={addKwLevel} onChange={e=>setAddKwLevel(e.target.value as any)} className="px-2 py-1.5 rounded-xl text-[11px] text-[#3d3568] outline-none" style={{background:"rgba(237,233,255,0.6)",border:"1px solid rgba(124,92,252,0.16)",fontFamily:"inherit"}}><option value="高">高风险</option><option value="中">中风险</option><option value="低">低风险</option></select>
            <input value={addKw} onChange={e=>setAddKw(e.target.value)} placeholder="输入违禁词" className="px-3 py-1.5 rounded-xl text-xs text-[#3d3568] placeholder-[#b0aac8] outline-none w-24" style={{background:"rgba(240,238,255,0.55)",border:"1px solid rgba(124,92,252,0.16)",fontFamily:"inherit"}}/>
            <button onClick={()=>{if(addKw.trim()){setKeywords(p=>[...p,{id:Date.now(),word:addKw.trim(),level:addKwLevel,createdAt:"2026-06-29"}]);setAddKw("");}}} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white" style={{background:"linear-gradient(135deg,#7c3aed,#6366f1)",boxShadow:"0 2px 8px rgba(124,92,252,0.3)"}}><Plus size={12}/>添加</button>
          </div>
        </div>
        <div className="p-4 sm:p-5"><div className="flex flex-wrap gap-2">
          {keywords.map(kw=>{const s=kw.level==="高"?{bg:"bg-red-50",text:"text-red-500",bd:"rgba(239,68,68,0.2)"}:kw.level==="中"?{bg:"bg-amber-50",text:"text-amber-500",bd:"rgba(245,158,11,0.2)"}:{bg:"bg-blue-50",text:"text-blue-500",bd:"rgba(59,130,246,0.2)"};return(
            <div key={kw.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${s.bg}`} style={{border:`1px solid ${s.bd}`}}>
              <span className={`text-xs font-medium ${s.text}`}>{kw.word}</span><span className={`text-[9px] font-bold ${s.text} opacity-70`}>{kw.level}</span>
              <button onClick={()=>setKeywords(p=>p.filter(x=>x.id!==kw.id))} className={`${s.text} opacity-50 hover:opacity-100 transition-opacity`}><X size={11}/></button>
            </div>
          );})}
        </div></div>
      </div>

      <div className="relative rounded-2xl overflow-hidden" style={glassStrong}>
        <Shimmer/>
        <div className="px-4 sm:px-5 py-4 flex items-center justify-between" style={{borderBottom:"1px solid rgba(255,255,255,0.6)"}}>
          <div><div className="text-sm font-bold text-[#1e1b4b]">禁投行业设置</div></div>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white" style={{background:"linear-gradient(135deg,#7c3aed,#6366f1)",boxShadow:"0 2px 8px rgba(124,92,252,0.3)"}}><Plus size={13}/>添加</button>
        </div>
        {/* Mobile */}
        <div className="md:hidden p-4 flex flex-col gap-3">
          {industries.map(ind=>(
            <div key={ind.id} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{background:"rgba(237,233,255,0.4)",border:"1px solid rgba(124,92,252,0.08)"}}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5"><span className="text-xs font-semibold text-[#1e1b4b]">{ind.name}</span><span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${ind.enabled?"bg-red-50 text-red-500":"bg-gray-100 text-gray-400"}`}>{ind.enabled?"禁投":"已解除"}</span></div>
                <div className="text-[11px] text-[#8b83b8]">{ind.remark}</div>
              </div>
              <button onClick={()=>setIndustries(p=>p.map(x=>x.id===ind.id?{...x,enabled:!x.enabled}:x))} className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-violet-50 text-violet-600 whitespace-nowrap">{ind.enabled?"解除":"禁投"}</button>
            </div>
          ))}
        </div>
        {/* Desktop */}
        <div className="hidden md:block p-5">
          <table className="w-full text-xs border-collapse">
            <thead><tr style={{background:"rgba(237,233,255,0.7)"}}>{["行业名称","备注说明","状态","操作"].map(h=><th key={h} className="px-4 py-2.5 text-left font-semibold text-[#4c3d9e] whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>{industries.map((ind,ri)=>(
              <tr key={ind.id} className="hover:bg-violet-50/40 transition-colors" style={{background:ri%2===0?"rgba(255,255,255,0.35)":"rgba(248,246,255,0.35)"}}>
                <td className="px-4 py-2.5 font-semibold text-[#1e1b4b]">{ind.name}</td>
                <td className="px-4 py-2.5 text-[#8b83b8]">{ind.remark}</td>
                <td className="px-4 py-2.5"><span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${ind.enabled?"bg-red-50 text-red-500":"bg-gray-100 text-gray-400"}`}>{ind.enabled?"禁止投放":"已解除"}</span></td>
                <td className="px-4 py-2.5"><div className="flex items-center gap-1.5">
                  <button onClick={()=>setIndustries(p=>p.map(x=>x.id===ind.id?{...x,enabled:!x.enabled}:x))} className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-violet-50 text-violet-600">{ind.enabled?"解除禁投":"重新禁投"}</button>
                  <button onClick={()=>setIndustries(p=>p.filter(x=>x.id!==ind.id))} className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-red-50 hover:text-red-500 text-[#8b83b8] transition-colors"><Trash2 size={11}/></button>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── AccountsPage ─────────────────────────────────────────────────────────────
function AccountsPage() {
  const [accounts,    setAccounts]    = useState(INIT_ACCOUNTS);
  const [editTarget,  setEditTarget]  = useState<Account|null>(null);
  const [resetTarget, setResetTarget] = useState<Account|null>(null);
  const [newPwd, setNewPwd] = useState("");
  const roleBadge   = (r:AccountRole)   => r==="admin"  ?<span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600">管理员</span>:<span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-500">审核员</span>;
  const statusBadge = (s:AccountStatus) => s==="active" ?<span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600">正常</span>:<span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">停用</span>;
  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-5 flex flex-col gap-4">
      <div className="relative rounded-2xl overflow-hidden" style={glassStrong}>
        <Shimmer/>
        <div className="px-4 sm:px-5 py-4 flex items-center justify-between" style={{borderBottom:"1px solid rgba(255,255,255,0.6)"}}>
          <div><div className="text-sm font-bold text-[#1e1b4b]">账号列表</div><div className="text-[10px] text-[#8b83b8] mt-0.5">共 {accounts.length} 个账号</div></div>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white" style={{background:"linear-gradient(135deg,#7c3aed,#6366f1)",boxShadow:"0 2px 8px rgba(124,92,252,0.3)"}}><Plus size={13}/>新增</button>
        </div>
        {/* Mobile */}
        <div className="md:hidden p-4 flex flex-col gap-3">
          {accounts.map(a=>(
            <div key={a.id} className="px-4 py-3 rounded-xl" style={{background:"rgba(237,233,255,0.4)",border:"1px solid rgba(124,92,252,0.08)"}}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0">{a.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap"><span className="font-semibold text-[#1e1b4b] text-sm">{a.name}</span>{roleBadge(a.role)}{statusBadge(a.status)}</div>
                  <div className="text-[10px] text-[#b0aac8] mt-0.5">{a.username} · 最后登录 {a.lastLogin.split(" ")[0]}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>setEditTarget(a)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium" style={{background:"rgba(237,233,255,0.8)",color:"#6d28d9",border:"1px solid rgba(124,92,252,0.2)"}}><Edit3 size={12}/>编辑</button>
                <button onClick={()=>setResetTarget(a)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium" style={{background:"rgba(239,246,255,0.8)",color:"#2563eb",border:"1px solid rgba(37,99,235,0.2)"}}><KeyRound size={12}/>重置密码</button>
                <button onClick={()=>setAccounts(p=>p.map(x=>x.id===a.id?{...x,status:x.status==="active"?"disabled":"active"}:x))} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium ${a.status==="active"?"bg-red-50 text-red-500":"bg-emerald-50 text-emerald-600"}`} style={{border:`1px solid ${a.status==="active"?"rgba(239,68,68,0.2)":"rgba(16,185,129,0.2)"}`}}>
                  {a.status==="active"?<><ShieldOff size={12}/>停用</>:<><ShieldCheck size={12}/>启用</>}
                </button>
              </div>
            </div>
          ))}
        </div>
        {/* Desktop */}
        <div className="hidden md:block overflow-auto">
          <table className="w-full text-xs border-collapse">
            <thead><tr style={{background:"rgba(237,233,255,0.7)"}}>{["用户名","姓名","角色","状态","创建时间","最后登录","操作"].map(h=><th key={h} className="px-4 py-2.5 text-left font-semibold text-[#4c3d9e] whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>{accounts.map((a,ri)=>(
              <tr key={a.id} className="hover:bg-violet-50/40 transition-colors" style={{background:ri%2===0?"rgba(255,255,255,0.35)":"rgba(248,246,255,0.35)"}}>
                <td className="px-4 py-2.5 font-mono text-[11px] text-[#4c3d9e]">{a.username}</td>
                <td className="px-4 py-2.5"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">{a.name[0]}</div><span className="font-medium text-[#1e1b4b]">{a.name}</span></div></td>
                <td className="px-4 py-2.5">{roleBadge(a.role)}</td>
                <td className="px-4 py-2.5">{statusBadge(a.status)}</td>
                <td className="px-4 py-2.5 text-[10px] text-[#8b83b8] whitespace-nowrap">{a.createdAt}</td>
                <td className="px-4 py-2.5 text-[10px] text-[#8b83b8] whitespace-nowrap">{a.lastLogin}</td>
                <td className="px-4 py-2.5"><div className="flex items-center gap-1 flex-nowrap">
                  <button onClick={()=>setEditTarget(a)} className="flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap" style={{background:"rgba(237,233,255,0.8)",color:"#6d28d9",border:"1px solid rgba(124,92,252,0.2)"}}><Edit3 size={10}/>编辑</button>
                  <button onClick={()=>setResetTarget(a)} className="flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap" style={{background:"rgba(239,246,255,0.8)",color:"#2563eb",border:"1px solid rgba(37,99,235,0.2)"}}><KeyRound size={10}/>重置</button>
                  <button onClick={()=>setAccounts(p=>p.map(x=>x.id===a.id?{...x,status:x.status==="active"?"disabled":"active"}:x))} className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap ${a.status==="active"?"bg-red-50 text-red-500":"bg-emerald-50 text-emerald-600"}`} style={{border:`1px solid ${a.status==="active"?"rgba(239,68,68,0.2)":"rgba(16,185,129,0.2)"}`}}>
                    {a.status==="active"?<><ShieldOff size={10}/>停用</>:<><ShieldCheck size={10}/>启用</>}
                  </button>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      {editTarget && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4" style={{background:"rgba(30,27,75,0.35)",backdropFilter:"blur(8px)"}}>
          <div className="relative w-full sm:w-[400px] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 overflow-hidden" style={glassStrong}>
            <Shimmer/>
            <div className="flex items-center justify-between mb-5"><div className="text-sm font-bold text-[#1e1b4b]">编辑账号</div><button onClick={()=>setEditTarget(null)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50"><X size={14} className="text-[#8b83b8]"/></button></div>
            <div className="flex flex-col gap-3 mb-5">
              {[{label:"用户名",val:editTarget.username},{label:"姓名",val:editTarget.name}].map((f,i)=>(
                <div key={i}><div className="text-xs font-semibold text-[#4c3d9e] mb-1.5">{f.label}</div><input defaultValue={f.val} className="w-full px-3 py-3 rounded-xl text-sm text-[#3d3568] outline-none" style={{background:"rgba(240,238,255,0.55)",border:"1px solid rgba(124,92,252,0.16)",fontFamily:"inherit"}}/></div>
              ))}
              <div><div className="text-xs font-semibold text-[#4c3d9e] mb-1.5">角色</div><select defaultValue={editTarget.role} className="w-full px-3 py-3 rounded-xl text-sm text-[#3d3568] outline-none" style={{background:"rgba(240,238,255,0.55)",border:"1px solid rgba(124,92,252,0.16)",fontFamily:"inherit"}}><option value="reviewer">审核员</option><option value="admin">管理员</option></select></div>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>setEditTarget(null)} className="flex-1 py-3 rounded-xl text-sm font-medium text-[#8b83b8] hover:bg-violet-50 transition-colors">取消</button>
              <button onClick={()=>setEditTarget(null)} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white" style={{background:"linear-gradient(135deg,#7c3aed,#6366f1)"}}>保存修改</button>
            </div>
          </div>
        </div>
      )}
      {resetTarget && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4" style={{background:"rgba(30,27,75,0.35)",backdropFilter:"blur(8px)"}}>
          <div className="relative w-full sm:w-[380px] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 overflow-hidden" style={glassStrong}>
            <Shimmer/>
            <div className="flex items-center justify-between mb-5"><div className="text-sm font-bold text-[#1e1b4b]">重置密码 — {resetTarget.name}</div><button onClick={()=>{setResetTarget(null);setNewPwd("")}} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50"><X size={14} className="text-[#8b83b8]"/></button></div>
            <div className="mb-5"><div className="text-xs font-semibold text-[#4c3d9e] mb-1.5">新密码</div><input type="password" value={newPwd} onChange={e=>setNewPwd(e.target.value)} placeholder="请输入新密码（至少8位）" className="w-full px-3 py-3 rounded-xl text-sm text-[#3d3568] placeholder-[#b0aac8] outline-none" style={{background:"rgba(240,238,255,0.55)",border:"1px solid rgba(124,92,252,0.16)",fontFamily:"inherit"}}/></div>
            <div className="flex gap-2">
              <button onClick={()=>{setResetTarget(null);setNewPwd("")}} className="flex-1 py-3 rounded-xl text-sm font-medium text-[#8b83b8] hover:bg-violet-50 transition-colors">取消</button>
              <button onClick={()=>{setResetTarget(null);setNewPwd("")}} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white" style={{background:"linear-gradient(135deg,#7c3aed,#6366f1)"}}>确认重置</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeNav,  setActiveNav]  = useState("dashboard");
  const [todoTab,    setTodoTab]    = useState("all");
  const [showNotif,  setShowNotif]  = useState(false);
  const [showUser,   setShowUser]   = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [detailAd,   setDetailAd]   = useState<AdRow|null>(null);
  const [detailFrom, setDetailFrom] = useState("dashboard");

  const handleViewDetail = (ad:AdRow,from:string) => { setDetailAd(ad); setDetailFrom(from); setMenuOpen(false); };
  const handleBackFromDetail = () => { setDetailAd(null); setActiveNav(detailFrom); };

  const nav = (key:string) => { setActiveNav(key); setDetailAd(null); setMenuOpen(false); };

  const meta = detailAd
    ? {title:"广告详情",sub:"广告审核列表 > 广告详情"}
    : (PAGE_TITLE[activeNav] ?? PAGE_TITLE.dashboard);

  const statCards = [
    {label:"今日待审核",   value:48,  icon:Clock,       color:"text-amber-500",   bg:"bg-amber-50"},
    {label:"今日审核通过", value:127, icon:CheckCircle, color:"text-emerald-500", bg:"bg-emerald-50"},
    {label:"今日驳回广告", value:34,  icon:XCircle,     color:"text-red-500",     bg:"bg-red-50"},
    {label:"历史违规下架", value:892, icon:TrendingDown, color:"text-violet-600",  bg:"bg-violet-50"},
  ];

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-2.5 mb-8 px-2">
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm shrink-0" style={{boxShadow:"inset 0 1px 0 rgba(255,255,255,0.3)"}}><Shield size={18} className="text-white"/></div>
        <div><div className="text-white font-bold text-[13px] leading-tight">广告审核后台</div><div className="text-white/45 text-[9px] mt-0.5">AdReview Management</div></div>
        {/* Mobile close */}
        <button onClick={()=>setMenuOpen(false)} className="ml-auto md:hidden w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center"><X size={15} className="text-white"/></button>
      </div>
      <div className="mb-4">
        <div className="text-white/30 text-[9px] font-semibold uppercase tracking-widest px-3 mb-2">核心功能</div>
        <nav className="flex flex-col gap-0.5">
          {NAV.map(item=>(
            <button key={item.key} onClick={()=>nav(item.key)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group relative" style={{background:activeNav===item.key&&!detailAd?"rgba(255,255,255,0.18)":"transparent"}}>
              <item.icon size={16} className={activeNav===item.key&&!detailAd?"text-white":"text-white/50 group-hover:text-white/80"}/>
              <span className={`text-[13px] font-medium flex-1 ${activeNav===item.key&&!detailAd?"text-white":"text-white/50 group-hover:text-white/80"}`}>{item.label}</span>
              {item.badge && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white">{item.badge}</span>}
            </button>
          ))}
        </nav>
      </div>
      <div className="mb-4">
        <div className="text-white/30 text-[9px] font-semibold uppercase tracking-widest px-3 mb-2">审核配置</div>
        <nav className="flex flex-col gap-0.5">
          {NAV_CONFIG.map(item=>(
            <button key={item.key} onClick={()=>nav(item.key)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group" style={{background:activeNav===item.key&&!detailAd?"rgba(255,255,255,0.18)":"transparent"}}>
              <item.icon size={15} className={activeNav===item.key&&!detailAd?"text-white":"text-white/40 group-hover:text-white/70"}/>
              <span className={`text-[12px] font-medium ${activeNav===item.key&&!detailAd?"text-white":"text-white/40 group-hover:text-white/70"}`}>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
      <div className="flex-1">
        <div className="text-white/30 text-[9px] font-semibold uppercase tracking-widest px-3 mb-2">账号管理</div>
        <nav className="flex flex-col gap-0.5">
          {NAV_ADMIN.map(item=>(
            <button key={item.key} onClick={()=>nav(item.key)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group" style={{background:activeNav===item.key&&!detailAd?"rgba(255,255,255,0.18)":"transparent"}}>
              <item.icon size={15} className={activeNav===item.key&&!detailAd?"text-white":"text-white/40 group-hover:text-white/70"}/>
              <span className={`text-[12px] font-medium ${activeNav===item.key&&!detailAd?"text-white":"text-white/40 group-hover:text-white/70"}`}>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-2.5 px-3 py-3 rounded-xl" style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.1)"}}>
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-300 to-purple-400 flex items-center justify-center text-white text-[11px] font-bold shrink-0">陈</div>
        <div className="flex-1 min-w-0"><div className="text-white text-[11px] font-semibold truncate">陈晓雨</div><div className="text-white/40 text-[9px]">高级审核员</div></div>
        <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"/>
      </div>
    </>
  );

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden" style={{fontFamily:"'Plus Jakarta Sans','DM Sans',sans-serif",background:"linear-gradient(135deg,#eef0fb 0%,#f3f0ff 40%,#e8eeff 100%)"}}>
      {/* Background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-30" style={{background:"radial-gradient(circle,#a78bfa 0%,transparent 70%)",filter:"blur(70px)"}}/>
        <div className="absolute top-1/4 -right-32 w-[400px] h-[400px] rounded-full opacity-20" style={{background:"radial-gradient(circle,#818cf8 0%,transparent 70%)",filter:"blur(80px)"}}/>
        <div className="absolute -bottom-20 left-1/3 w-[360px] h-[360px] rounded-full opacity-25" style={{background:"radial-gradient(circle,#c4b5fd 0%,transparent 70%)",filter:"blur(60px)"}}/>
      </div>

      {/* Mobile sidebar overlay */}
      {menuOpen && <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={()=>setMenuOpen(false)}/>}

      {/* Sidebar — fixed on mobile, static on desktop */}
      <aside className={`fixed md:relative inset-y-0 left-0 z-50 flex flex-col w-[220px] min-w-[220px] h-full py-6 px-4 transition-transform duration-300 ${menuOpen?"translate-x-0":"-translate-x-full"} md:translate-x-0`} style={{background:"linear-gradient(180deg,#5b21b6 0%,#7c3aed 25%,#6d28d9 55%,#6366f1 80%,#818cf8 100%)",boxShadow:"4px 0 40px rgba(109,40,217,0.25), inset -1px 0 0 rgba(255,255,255,0.08)"}}>
        <SidebarContent/>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-3 px-3 sm:px-6 py-3 shrink-0 relative z-40" style={{borderBottom:"1px solid rgba(255,255,255,0.6)",background:"rgba(255,255,255,0.45)",backdropFilter:"blur(24px) saturate(160%)",WebkitBackdropFilter:"blur(24px) saturate(160%)"}}>
          {/* Hamburger */}
          <button onClick={()=>setMenuOpen(true)} className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{background:"rgba(255,255,255,0.55)",border:"1px solid rgba(255,255,255,0.78)"}}>
            <Menu size={18} className="text-[#6d28d9]"/>
          </button>
          <div className="min-w-0 flex-1 md:flex-none">
            <div className="text-sm sm:text-base font-bold text-[#1e1b4b] leading-tight truncate">{meta.title}</div>
            <div className="text-[9px] sm:text-[10px] text-[#8b83b8] hidden sm:block">{meta.sub}</div>
          </div>
          {/* Desktop search */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl w-full" style={{background:"rgba(240,238,255,0.55)",backdropFilter:"blur(16px)",border:"1px solid rgba(124,92,252,0.16)"}}>
              <Search size={14} className="text-violet-400 shrink-0"/>
              <input placeholder="搜索广告主、广告 ID…" className="bg-transparent outline-none text-xs text-[#3d3568] placeholder-[#b0aac8] flex-1" style={{fontFamily:"inherit"}}/>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto shrink-0">
            <div className="relative">
              <button onClick={()=>{setShowNotif(!showNotif);setShowUser(false)}} className="relative w-9 h-9 rounded-xl flex items-center justify-center" style={{background:"rgba(255,255,255,0.55)",border:"1px solid rgba(255,255,255,0.78)"}}>
                <Bell size={16} className="text-[#6d28d9]"/><span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">6</span>
              </button>
              {showNotif && <NotifDropdown/>}
            </div>
            <div className="relative">
              <button onClick={()=>{setShowUser(!showUser);setShowNotif(false)}} className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-xl" style={{background:"rgba(255,255,255,0.55)",border:"1px solid rgba(255,255,255,0.78)"}}>
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">陈</div>
                <div className="text-left hidden sm:block"><div className="text-xs font-semibold text-[#1e1b4b] leading-none">陈晓雨</div><div className="text-[9px] text-[#8b83b8] mt-0.5">高级审核员</div></div>
                <ChevronDown size={12} className="text-[#8b83b8] hidden sm:block"/>
              </button>
              {showUser && <UserDropdown/>}
            </div>
          </div>
        </header>

        {/* Page content */}
        {detailAd && <AdDetailPage ad={detailAd} onBack={handleBackFromDetail}/>}
        {!detailAd && activeNav==="review"       && <ReviewListPage onViewDetail={ad=>handleViewDetail(ad,"review")}/>}
        {!detailAd && activeNav==="violations"   && <ViolationsPage/>}
        {!detailAd && activeNav==="logs"         && <LogsPage/>}
        {!detailAd && activeNav==="audit-config" && <AuditConfigPage/>}
        {!detailAd && activeNav==="accounts"     && <AccountsPage/>}

        {/* Dashboard */}
        {!detailAd && activeNav==="dashboard" && (
          <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-5 flex flex-col gap-4 sm:gap-5">

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 shrink-0">
              {statCards.map((c,i)=>(
                <div key={i} className="relative flex items-center gap-3 px-4 py-4 rounded-2xl overflow-hidden shrink-0" style={glassStrong}>
                  <Shimmer/>
                  <div className={`relative w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}><c.icon size={18} className={c.color}/></div>
                  <div className="relative min-w-0">
                    <div className={`text-xl sm:text-2xl font-bold leading-tight ${c.color}`}>{c.value}</div>
                    <div className="text-[10px] sm:text-[11px] text-[#1e1b4b] font-medium leading-tight">{c.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Todo: full width, fixed height */}
            <div className="relative rounded-2xl overflow-hidden shrink-0 flex flex-col" style={{...glass, height:380}}>
              <Shimmer/>
              <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 shrink-0" style={{borderBottom:"1px solid rgba(255,255,255,0.6)"}}>
                <div><div className="text-sm font-bold text-[#1e1b4b]">待办加急区域</div><div className="text-[10px] text-[#8b83b8] mt-0.5 hidden sm:block">今日待审核 48 条 · 点击【去审核】进入详情</div></div>
                <div className="flex items-center gap-1 p-1 rounded-xl" style={{background:"rgba(255,255,255,0.55)",border:"1px solid rgba(255,255,255,0.78)"}}>
                  {[{k:"all",l:"全部",count:ADS.length},{k:"urgent",l:"加急",count:ADS.filter(a=>a.urgent).length},{k:"timeout",l:"超时",count:ADS.filter(a=>a.timeout).length}].map(t=>(
                    <button key={t.k} onClick={()=>setTodoTab(t.k)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap" style={todoTab===t.k?{background:"linear-gradient(135deg,#7c3aed,#6366f1)",color:"#fff",boxShadow:"0 2px 8px rgba(124,92,252,0.28)"}:{color:"#8b83b8"}}>
                      {t.l}<span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${todoTab===t.k?"bg-white/25 text-white":"bg-violet-50 text-violet-400"}`}>{t.count}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-y-auto flex-1"><TodoTable tab={todoTab} onViewDetail={ad=>handleViewDetail(ad,"dashboard")}/></div>
            </div>

            {/* Chart + Stats: side by side on desktop, stacked on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
              {/* Chart */}
              <div className="md:col-span-2 relative rounded-2xl overflow-hidden shrink-0" style={glassStrong}>
                <Shimmer/>
                <div className="px-4 sm:px-5 py-3.5" style={{borderBottom:"1px solid rgba(255,255,255,0.6)"}}>
                  <div className="text-sm font-bold text-[#1e1b4b]">今日审核趋势</div>
                  <div className="text-[10px] text-[#8b83b8] mt-0.5">每小时通过 / 驳回数量</div>
                </div>
                <div className="px-3 sm:px-4 py-4 flex flex-col gap-3">
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={HOUR_DATA} margin={{left:-20,right:4}}>
                      <defs>
                        <linearGradient id="dashGradPass" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25}/><stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02}/></linearGradient>
                        <linearGradient id="dashGradReject" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/><stop offset="95%" stopColor="#f43f5e" stopOpacity={0.02}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,92,252,0.08)" vertical={false}/>
                      <XAxis dataKey="h" tick={{fontSize:9,fill:"#b0aac8"}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontSize:9,fill:"#b0aac8"}} axisLine={false} tickLine={false} width={24}/>
                      <RTooltip content={<ChartTip/>}/>
                      <Area key="area-pass"   type="monotone" dataKey="通过" stroke="#7c3aed" strokeWidth={2} fill="url(#dashGradPass)"   dot={false} activeDot={{r:4,fill:"#7c3aed"}} isAnimationActive={false}/>
                      <Area key="area-reject" type="monotone" dataKey="驳回" stroke="#f43f5e" strokeWidth={2} fill="url(#dashGradReject)" dot={false} activeDot={{r:4,fill:"#f43f5e"}} isAnimationActive={false}/>
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-1 rounded-full bg-violet-500"/><span className="text-[10px] text-[#8b83b8]">通过</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-1 rounded-full bg-red-400"/><span className="text-[10px] text-[#8b83b8]">驳回</span></div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[{label:"今日峰值",value:"52/时",color:"text-violet-600"},{label:"驳回率",value:"21.1%",color:"text-red-400"},{label:"平均处理",value:"3.2分钟",color:"text-blue-500"},{label:"效率指数",value:"A+",color:"text-emerald-500"}].map((s,i)=>(
                      <div key={i} className="px-2 py-2 rounded-xl text-center" style={{background:"rgba(237,233,255,0.4)",border:"1px solid rgba(124,92,252,0.08)"}}>
                        <div className={`text-sm font-bold ${s.color}`}>{s.value}</div><div className="text-[9px] text-[#8b83b8]">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="relative rounded-2xl p-4 sm:p-5 overflow-hidden shrink-0" style={glassStrong}>
                <Shimmer/>
                <div className="text-sm font-bold text-[#1e1b4b] mb-3">快捷操作</div>
                <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                  {[
                    {icon:CheckSquare,label:"批量审核广告",sub:"多选后批量通过/驳回",iconBg:"bg-violet-50",iconColor:"text-violet-600"},
                    {icon:Download,   label:"导出今日记录",sub:"审核结果 Excel 报表",iconBg:"bg-blue-50",  iconColor:"text-blue-600"},
                    {icon:BookOpen,   label:"审核规范手册",sub:"快速查阅违规标准",   iconBg:"bg-fuchsia-50",iconColor:"text-fuchsia-600"},
                    {icon:RefreshCw,  label:"刷新待审队列",sub:"获取最新提交广告",   iconBg:"bg-emerald-50",iconColor:"text-emerald-600"},
                  ].map((btn,i)=>(
                    <button key={i} className="relative flex items-center gap-2.5 px-3 py-3 rounded-xl text-left overflow-hidden transition-all hover:scale-[1.02] group" style={glassStrong}>
                      <div className={`relative w-8 h-8 rounded-xl ${btn.iconBg} flex items-center justify-center shrink-0`}><btn.icon size={15} className={btn.iconColor}/></div>
                      <div className="relative flex-1 min-w-0"><div className="text-[11px] font-bold text-[#1e1b4b] leading-tight">{btn.label}</div><div className="text-[9px] text-[#8b83b8] mt-0.5 hidden sm:block">{btn.sub}</div></div>
                      <ArrowUpRight size={12} className="relative text-[#8b83b8] shrink-0 group-hover:text-violet-500 transition-colors"/>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Violations TOP 5 */}
            <div className="relative rounded-2xl p-4 sm:p-5 overflow-hidden shrink-0" style={glassStrong}>
              <Shimmer/>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-bold text-[#1e1b4b]">近期高频违规 TOP 5</div>
                <span className="text-[10px] bg-red-50 text-red-500 font-semibold px-2.5 py-1 rounded-full">今日驳回 34 条</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-3">
                {VIOLATIONS_TOP.map((v,i)=>(
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{background:i===0?"linear-gradient(135deg,#f43f5e,#e11d48)":i===1?"linear-gradient(135deg,#f97316,#ea580c)":i===2?"linear-gradient(135deg,#eab308,#ca8a04)":"rgba(180,176,220,0.8)"}}>{i+1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1"><span className="text-[11px] font-medium text-[#3d3568] truncate">{v.type}</span><span className="text-[11px] font-bold ml-3 shrink-0" style={{color:v.color}}>{v.count}次</span></div>
                      <div className="w-full h-1.5 rounded-full" style={{background:"rgba(237,233,255,0.6)"}}><div className="h-full rounded-full" style={{width:`${v.pct}%`,background:v.color,opacity:0.8}}/></div>
                    </div>
                    <span className="text-[10px] font-semibold w-8 text-right shrink-0" style={{color:v.color}}>{v.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notices */}
            <div className="relative rounded-2xl px-4 sm:px-5 py-4 overflow-hidden shrink-0" style={glass}>
              <Shimmer/>
              <div className="flex items-start sm:items-center gap-3 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-2 shrink-0"><Megaphone size={14} className="text-violet-500"/><span className="text-xs font-bold text-[#1e1b4b]">系统通知</span></div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 flex-1">
                  {NOTICES.map((n,i)=>{const dc=n.type==="update"?"bg-violet-400":n.type==="alert"?"bg-red-400":"bg-blue-400";return(
                    <div key={i} className="flex items-center gap-2 min-w-0"><div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dc}`}/><span className="text-xs text-[#3d3568]">{n.text}</span></div>
                  );})}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
