## ADDED Requirements

### Requirement: 用户注册需邀请码

系统 SHALL 允许用户注册账号,注册时必须提供有效的邀请码;邀请码配置在 `InviteCode` 配置项中。注册成功后用户获得登录凭证资格。

#### Scenario: 使用正确邀请码注册成功

- **WHEN** 用户提交注册请求,包含用户名、账号、密码和正确的邀请码
- **THEN** 系统创建账号并返回成功响应,用户可登录

#### Scenario: 使用错误邀请码注册失败

- **WHEN** 用户提交注册请求但邀请码不正确
- **THEN** 系统拒绝注册并返回 400 错误,提示邀请码无效

#### Scenario: 重复账号注册失败

- **WHEN** 用户使用已存在的账号名注册
- **THEN** 系统拒绝注册并返回 409 冲突错误

### Requirement: 用户登录签发 JWT

系统 SHALL 允许已注册用户使用账号和密码登录,登录成功返回 JWT;密码使用 ASP.NET Core Identity `PasswordHasher` 哈希存储。

#### Scenario: 账号密码正确登录成功

- **WHEN** 用户提交正确的账号和密码
- **THEN** 系统返回 JWT 令牌,令牌包含用户标识且有过期时间

#### Scenario: 密码错误登录失败

- **WHEN** 用户提交错误的密码
- **THEN** 系统返回 401 错误且不签发令牌

### Requirement: 受保护接口需要认证

系统 SHALL 要求所有写入类接口(创建/编辑/删除)携带有效 JWT;未携带或令牌失效时拒绝访问。

#### Scenario: 未登录访问写入接口被拒

- **WHEN** 未携带 JWT 调用写入接口
- **THEN** 系统返回 401 未授权错误

#### Scenario: 携带有效 JWT 可访问写入接口

- **WHEN** 请求头携带有效 JWT 调用写入接口
- **THEN** 系统允许访问并执行操作

#### Scenario: 令牌过期被拒

- **WHEN** 携带已过期的 JWT 调用写入接口
- **THEN** 系统返回 401 错误
