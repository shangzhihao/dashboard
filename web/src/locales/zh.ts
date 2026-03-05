const zh = {
  translation: {
    brand: {
      title: '期货交易',
    },
    search: {
      placeholder: '搜索',
    },
    side: {
      header: '品类',
    },
  nav: {
    futures: '期货',
    spot: '现货',
    futuresAccount: '期货开户',
    },
    pill: {
      seasonalAnalysis: '季节性分析',
      monthlyChangeStats: '涨跌统计',
      positionsLeaderboard: '持仓龙虎榜',
      seatTracking: '席位追踪',
      netPositions: '持仓净量',
      rollOver: '移仓换月',
      longShortChart: '持仓多空图',
      warehouseReceiptAnalysis: '仓单分析',
      spreadPositions: '价差持仓',
      termStructure: '期限结构',
      calendarArbitrage: '跨期套利',
      interCommodityArbitrage: '跨品种套利',
      customArbitrage: '自定义套利',
      basisAnalysis: '基差分析',
      inventoryWeeklyReport: '库存周报',
      industryProfit: '产业利润',
      moreComing: '更多待开发',
    },
    category: {
      black: {
        title: '黑色系',
        iron: '铁矿',
        rebar: '螺纹',
        hot: '热卷',
        coal: '焦煤',
      },
      agri: {
        title: '农产品',
        meal: '豆粕',
        corn: '玉米',
        oil: '棕榈',
      },
      energy: {
        title: '能源化工',
        crude: '原油',
        fuel: '燃油',
        bitumen: '沥青',
      },
      metal: {
        title: '有色',
        cu: '铜/CU',
        al: '铝/AL',
        zn: '锌/ZN',
        ni: '镍/NI',
      },
    },
    chart: {
      titles: {
        panel: '持仓数据图表',
        chart: '沪铝/AL 05',
      },
      axes: {
        left: {
          label: '持仓(手)',
          price: '价格',
          positions: '持仓(手)',
        },
        right: {
          spread: '价差(元)',
        },
      },
      series: {
        net: '净持仓',
        long: '多头持仓',
        short: '空头持仓',
        price: '价格',
      },
      termStructure: {
        near: '近月',
        next: '连{{count}}',
        series: {
          today: '当日',
          weekAgo: '一周前',
          monthAgo: '一个月前',
          threeMonthsAgo: '三个月前',
          sixMonthsAgo: '六个月前',
          yearAgo: '一年前',
        },
      },
      calendarSpread: {
        nearContract: '近月合约',
        farContract: '远月合约',
        spread: '价差',
        series: {
          near: '近月合约收盘价',
          spread: '价差',
        },
      },
    },
    filters: {
      contract: {
        c01: '01合约',
        c02: '02合约',
        c03: '03合约',
        c04: '04合约',
        c05: '05合约',
        c06: '06合约',
        c07: '07合约',
        c08: '08合约',
        c09: '09合约',
        c10: '10合约',
        c11: '11合约',
        c12: '12合约',
        index: '指数',
      },
      metric: {
        price: '价格',
        positions: '持仓',
      },
    },
    stats: {
      monthlyChange: {
        title: '{{category}}/{{contract}} 期货涨跌统计',
        year: '年份',
        note: '注: 涨跌幅 = （月收盘价 - 月开盘价）/ 月开盘价 x 100%',
        months: {
          m01: '1月',
          m02: '2月',
          m03: '3月',
          m04: '4月',
          m05: '5月',
          m06: '6月',
          m07: '7月',
          m08: '8月',
          m09: '9月',
          m10: '10月',
          m11: '11月',
          m12: '12月',
        },
      },
    },
    common: {
      comingSoon: '敬请期待',
      feature: '功能',
      query: '查询',
    },
    footer: {
      copyright: 'Copyright © {{yearStart}} - {{yearEnd}} 期货数据中心',
    },
  },
};

export default zh;
